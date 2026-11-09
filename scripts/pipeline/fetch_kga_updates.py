"""
대한골프협회(KGA) 공식 레이팅 업데이트 자동 감지기
=============================================
KGA 웹사이트의 AllRatings_2.pdf 최신 변경 여부를 SHA-256 해시로 감지하여
새로운 공인 레이팅이 등록되었을 때 자동으로 데이터베이스를 갱신합니다.
"""

import urllib.request
import ssl
import hashlib
import os

KGA_URL = 'https://www.kgagolf.or.kr/infor/infor_data/AllRatings_2.pdf'
HASH_FILE = 'scripts/pipeline/.last_kga_hash'

def check_and_update():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    print(f"Checking for updates at {KGA_URL}...")
    req = urllib.request.Request(KGA_URL, headers={'User-Agent': 'Mozilla/5.0'})
    
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            content = resp.read()
            curr_hash = hashlib.sha256(content).hexdigest()
            print(f"Downloaded PDF size: {len(content)} bytes | SHA256: {curr_hash[:16]}...")
    except Exception as e:
        print(f"Failed to fetch KGA PDF: {e}")
        return False

    last_hash = ""
    if os.path.exists(HASH_FILE):
        with open(HASH_FILE, 'r', encoding='utf-8') as f:
            last_hash = f.read().strip()

    if curr_hash == last_hash:
        print("KGA AllRatings PDF is up to date (no changes detected).")
        return False
    else:
        print("New KGA AllRatings PDF update detected! Saving new hash...")
        with open(HASH_FILE, 'w', encoding='utf-8') as f:
            f.write(curr_hash)
        with open('AllRatings_latest.pdf', 'wb') as f:
            f.write(content)
        print("Saved to AllRatings_latest.pdf. Ready for parsing.")
        return True

if __name__ == '__main__':
    check_and_update()

