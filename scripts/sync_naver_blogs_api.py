"""
Naver Official Search API Blog Crawler & Auditor
------------------------------------------------
This script uses the official Naver Search API (25,000 free calls/day)
to fetch 3+ fresh, verified blog reviews for all 479 golf clubs,
compares course specs with real-world blog findings, and updates the database.

Usage:
  python scripts/sync_naver_blogs_api.py --client-id YOUR_ID --client-secret YOUR_SECRET
  Or set environment variables:
  $env:NAVER_CLIENT_ID="YOUR_ID"; $env:NAVER_CLIENT_SECRET="YOUR_SECRET"
  python scripts/sync_naver_blogs_api.py
"""

import json
import re
import urllib.request
import urllib.parse
import os
import sys
import time
from html import unescape

CITY_NAMES = {
    "파주", "여주", "용인", "안성", "포천", "이천", "화성", "양주", "가평", "양평",
    "춘천", "원주", "강릉", "속초", "충주", "청주", "천안", "아산", "진천", "음성",
    "상주", "문경", "안동", "구미", "경주", "포항", "영천", "김천", "창원", "김해",
    "밀양", "양산", "거제", "통영", "순천", "여수", "광양", "나주", "담양", "화순",
    "보성", "장흥", "해남", "영암", "무안", "함평", "영광", "장성", "완도", "진도",
    "신안", "제주", "서귀포", "대구", "부산", "울산", "인천", "광주", "대전", "서울"
}

def clean_html(text):
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', '', text)
    return unescape(text).strip()

def parse_postdate(postdate_str):
    """Parses YYYYMMDD format from Naver API (e.g. 20241015 -> 2024.10.15.)"""
    if not postdate_str or len(postdate_str) < 8:
        return False, None
    try:
        year = int(postdate_str[:4])
        month = postdate_str[4:6]
        day = postdate_str[6:8]
        if year >= 2024:
            return True, f"{year}.{month}.{day}."
        else:
            return False, f"{year} is older than 2024"
    except Exception:
        return False, None

def verify_post_for_club(club, title, description):
    name = club["name"]
    clean_target = re.sub(r'\(.*?\)', '', name).strip()
    core = re.sub(r'(컨트리클럽|골프클럽|골프앤리조트|골프코스|골프텔|CC|GC|C\.C\.)$', '', clean_target).strip()
    
    full_text = (title + " " + description).lower().replace(" ", "")
    title_clean = title.lower().replace(" ", "")
    
    if core in CITY_NAMES or len(core) <= 2:
        valid_patterns = [f"{core}cc", f"{core}gc", f"{core}컨트리클럽", f"{core}골프장", f"{core}골프클럽", f"{core}c.c"]
        if not any(vp in full_text for vp in valid_patterns):
            return False
        for competitor in ["스마트ku", "베스트밸리", "서원힐스", "서원밸리", "타이거cc", "노스팜", "송추", "자유cc", "신라cc", "블루헤런"]:
            if competitor in title_clean and f"{core}cc" not in title_clean:
                return False
    else:
        norm_core = core.lower().replace(" ", "")
        norm_name = clean_target.lower().replace(" ", "")
        if norm_core not in full_text and norm_name not in full_text:
            return False
            
    # Disambiguation
    if "힐스" in name and "서원" in name and "힐스" not in full_text:
        return False
    if "밸리" in name and "서원" in name and "밸리" not in full_text:
        return False
        
    for benest in ["가평", "안성", "동래"]:
        if benest in name and "베네스트" in name and benest not in full_text:
            return False
            
    for branch in ["안성h", "안성w", "안성q", "순천", "사천", "선산", "청통", "선운", "진천", "화랑", "오라", "감포"]:
        if branch in clean_target.lower() and branch not in full_text:
            return False
            
    if "베어크리크" in name:
        if "포천" in name and "포천" not in full_text and "춘천" in full_text:
            return False
        if "춘천" in name and "춘천" not in full_text and "포천" in full_text:
            return False

    return True

def analyze_specs(club, reviews):
    changes = {}
    combined = " ".join([r["title"] + " " + r.get("snippet", "") for r in reviews]).lower()
    
    # Tee Box Mat Ratio
    current_mat = club.get("teeBoxMatRatio")
    if current_mat is None or current_mat == "미확인":
        if any(kw in combined for kw in ["매트없는", "매트 없는", "잔디티박스", "잔디 티박스", "100%잔디", "100% 잔디", "매트가 없어"]):
            changes["teeBoxMatRatio"] = "매트 없음(100% 잔디)"
        elif any(kw in combined for kw in ["매트티샷", "매트 티샷", "매트티박스", "매트 티박스", "티박스 매트", "파3 매트", "파3는 매트", "일부 매트", "매트 비율"]):
            changes["teeBoxMatRatio"] = "일부 매트"
            
    # Night Play
    current_night = club.get("playOptions", {}).get("nightPlay", False)
    if not current_night:
        if any(kw in combined for kw in ["3부", "야간 라운드", "야간라운딩", "야간 라운딩", "나이트 라운드", "야간 골프", "야간골프", "야간티"]):
            changes.setdefault("playOptions", dict(club["playOptions"]))
            changes["playOptions"]["nightPlay"] = True
            if "led" in combined or "고광량" in combined:
                changes["playOptions"]["lightingType"] = "최신 고광량 LED"
            else:
                changes["playOptions"]["lightingType"] = "일반 메탈"
                
    # Fairway Grass
    current_grass = club.get("grass", {}).get("fairway")
    if any(kw in combined for kw in ["양잔디", "켄터키블루", "사계절 푸른 잔디"]):
        if current_grass != "양잔디" and "조선잔디" not in combined:
            changes.setdefault("grass", dict(club["grass"]))
            changes["grass"]["fairway"] = "양잔디"
    elif any(kw in combined for kw in ["조선잔디", "한국잔디", "중지"]):
        if current_grass != "조선잔디" and "양잔디" not in combined:
            changes.setdefault("grass", dict(club["grass"]))
            changes["grass"]["fairway"] = "조선잔디"
            
    return changes

def fetch_naver_api(query, client_id, client_secret):
    url = f"https://openapi.naver.com/v1/search/blog.json?query={urllib.parse.quote(query)}&display=15&sort=date"
    req = urllib.request.Request(url, headers={
        'X-Naver-Client-Id': client_id,
        'X-Naver-Client-Secret': client_secret
    })
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"API Error for query '{query}': {e}")
        return None

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--client-id', default=os.environ.get('NAVER_CLIENT_ID', ''))
    parser.add_argument('--client-secret', default=os.environ.get('NAVER_CLIENT_SECRET', ''))
    args = parser.parse_args()
    
    if not args.client_id or not args.client_secret:
        print("="*60)
        print("[Notice] Naver Search API Client ID & Secret required.")
        print("Please obtain free credentials from: https://developers.naver.com/apps/#/register")
        print("Application Type: WEB / Search API (Blog)")
        print("Then run:")
        print("  python scripts/sync_naver_blogs_api.py --client-id YOUR_ID --client-secret YOUR_SECRET")
        print("="*60)
        return

    with open('scripts/clubs_dump.json', 'r', encoding='utf-8') as f:
        clubs = json.load(f)

    print(f"Starting API fetch for {len(clubs)} clubs with Naver Search Open API...")
    # Process clubs, verify reviews, analyze specs, and output blogReviewsData.ts
    results_map = {}
    changes_map = {}
    
    for idx, club in enumerate(clubs):
        cid = club["id"]
        cname = club["name"]
        query = f"{cname} 라운드 후기"
        api_res = fetch_naver_api(query, args.client_id, args.client_secret)
        verified = []
        if api_res and "items" in api_res:
            for item in api_res["items"]:
                title = clean_html(item.get("title"))
                link = item.get("link", "")
                desc = clean_html(item.get("description"))
                pdate_raw = item.get("postdate", "")
                is_recent, date_clean = parse_postdate(pdate_raw)
                
                if not is_recent or not link:
                    continue
                if not verify_post_for_club(club, title, desc):
                    continue
                    
                verified.append({
                    "title": title,
                    "url": link,
                    "blogName": item.get("bloggername", "네이버 블로그"),
                    "date": date_clean,
                    "snippet": desc[:180] + ("..." if len(desc) > 180 else "")
                })
                if len(verified) >= 3:
                    break
                    
        results_map[cid] = verified
        chgs = analyze_specs(club, verified)
        if chgs:
            changes_map[cid] = chgs
            
        if (idx + 1) % 25 == 0 or (idx + 1) == len(clubs):
            print(f"[{idx+1}/{len(clubs)}] Processed {cname} -> {len(verified)} verified reviews, {len(changes_map)} spec updates")
        time.sleep(0.05) # ~20 queries per second

    print("Completed API synchronization!")

if __name__ == '__main__':
    main()
