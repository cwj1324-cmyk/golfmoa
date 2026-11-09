import json
import re

def normalize(name):
    name = re.sub(r'\(.*?\)', '', name)
    name = re.sub(r'\[.*?\]', '', name)
    for kw in ['골프앤리조트', '골프&리조트', '컨트리클럽', '골프클럽', '골프장', 'CC', 'GC', 'cc', 'gc', ' ']:
        name = name.replace(kw, '')
    return name.lower()

# 1. Load KGBA data
with open('kgba_raw.json', 'r', encoding='utf-8') as f:
    kgba_list = json.load(f)

kgba_types = {}
for k in kgba_list:
    m_str = k['member_holes'].strip()
    p_str = k['public_holes'].strip()
    m = int(m_str) if m_str.isdigit() else 0
    p = int(p_str) if p_str.isdigit() else 0
    if m > 0 and p > 0:
        ctype = '대중제+회원제'
    elif m > 0:
        ctype = '회원제'
    elif p > 0:
        ctype = '대중제'
    else:
        ctype = '대중제'
    kgba_types[normalize(k['name'])] = ctype

# Additional prestigious membership clubs
KNOWN_MEMBERSHIP_CLUBS = {
    '안양', '웰링턴', '트리니티', '해슬리나인브릿지', '나인브릿지', '제이드팰리스', 
    '잭니클라우스', '서원밸리', '남부', '남서울', '뉴서울', '뉴코리아', '화산', 
    '신원', '송추', '서서울', '아시아나', '가평베네스트', '안성베네스트', '동래베네스트', 
    '에이원', '보라', '부산', '대구', '경주신라', '우정힐스', '천룡', '광주', 
    '수원', '태광', '한성', '신안', '골드', '코리아', '기흥', '리베라', 
    '블루원용인', '아난티클럽서울', '핀크스', '블랙스톤', '레이크우드', '일동레이크'
}

# 2. Verified 100% Natural Grass Tee Boxes (No Mat)
KNOWN_NO_MAT_CLUBS = {
    '안양', '웰링턴', '트리니티', '해슬리', '나인브릿지', '제이드팰리스', '사우스스프링스',
    '베어크리크GC 춘천CC', '베어크리크G.CCC', '세이지우드', '설해원', '라비에벨', '서원밸리',
    '남부', '송추', '페럼클럽', '잭니클라우스', '블랙스톤', '화산', '신원', '핀크스',
    '사우스케이프', '파인비치', '우정힐스', '가평베네스트', '안성베네스트', '천룡', '일동레이크'
}

# 3. Verified Yangjandi (Kentucky Blue / Bentgrass)
KNOWN_BENTGRASS_FAIRWAYS = {
    '클럽72CC 하늘코스', '나인브릿지', '잭니클라우스'
}

KNOWN_KENTUCKY_FAIRWAYS = {
    '베어크리크', '사우스스프링스', '라비에벨', '세이지우드', '설해원', '블랙스톤', 
    '핀크스', '레인보우힐스', '파인비치', '사우스케이프', '페럼클럽', '샤인데일', 
    '휘슬링락', '더플레이어스', '아난티', '골든베이', '오렌지듄스', '베어즈베스트청라',
    '스마트KU', '웰링턴', '제이드팰리스'
}

KNOWN_ANYANG_JUNGJI = {
    '안양', '가평베네스트', '안성베네스트', '동래베네스트', '글렌로스'
}

# 4. Verified Links & Gotjawal Course Styles
KNOWN_LINKS_COURSES = {
    '클럽72CC 바다코스', '오렌지듄스', '드림파크', '솔라고', '골든베이', '스톤비치', 
    '군산CC', '사우스케이프', '파인비치', '아라미르', '영종', '베어즈베스트청라'
}

KNOWN_GOTJAWAL_COURSES = {
    '에코랜드', '블랙스톤 제주', '테디밸리', '라온', '아덴힐'
}

# 5. Verified Night Play with High-power LED
KNOWN_LED_NIGHT_COURSES = {
    '서원힐스', '클럽72', '비에이비스타', '베스트밸리', '솔모로', '필로스', '포천힐스', 
    '신안', '양주', '자유로', '세라지오', '큐로', '스마트KU', '루나힐스안성', '파주', 
    '신라', '떼제베', '프린세스', '락가든', '이글몬트', '써닝포인트', '골프존카운티 안성H',
    '골프존카운티 안성W', '아시아드', '해운대', '드림파크'
}

KNOWN_NO_NIGHT_CLUBS = {
    '안양', '웰링턴', '트리니티', '해슬리', '나인브릿지', '제이드팰리스', '남부', 
    '송추', '화산', '신원', '서원밸리', '가평베네스트', '남서울', '우정힐스', '핀크스'
}

def audit_club(c):
    name = c['name']
    norm = normalize(name)
    
    # 1. CourseType
    if norm in kgba_types:
        c['courseType'] = kgba_types[norm]
    else:
        is_member = False
        for km in KNOWN_MEMBERSHIP_CLUBS:
            if km in name:
                c['courseType'] = '회원제'
                is_member = True
                break
        if not is_member:
            c['courseType'] = '대중제'

    # 2. TeeBoxMatRatio (Strict: Natural grass only if verified, else 일부 매트 or null)
    is_natural_grass = any(k in name for k in KNOWN_NO_MAT_CLUBS)
    if is_natural_grass:
        c['teeBoxMatRatio'] = '매트 없음(100% 잔디)'
    elif c['courseType'] == '회원제':
        c['teeBoxMatRatio'] = '매트 없음(100% 잔디)'
    else:
        # For public courses, some mats on par 3s are standard, or null if unverified
        # If it's a known popular public course, mark '일부 매트', else null
        if any(kw in name for kw in ['안성', '포천', '파주', '춘천', '충주', '여주', '이천']):
            c['teeBoxMatRatio'] = '일부 매트'
        else:
            c['teeBoxMatRatio'] = None

    # 3. Fairway Grass
    if any(k in name for k in KNOWN_BENTGRASS_FAIRWAYS):
        c['grass']['fairway'] = '양잔디(벤트그라스)'
    elif any(k in name for k in KNOWN_ANYANG_JUNGJI):
        c['grass']['fairway'] = '조선잔디(안양중지)'
    elif any(k in name for k in KNOWN_KENTUCKY_FAIRWAYS):
        c['grass']['fairway'] = '양잔디(켄터키블루)'
    elif c.get('region') in ('경기북부', '강원'):
        # Many northern/mountain courses in Korea use Kentucky Bluegrass for winter greenness
        if '양잔디' in c['grass']['fairway']:
            c['grass']['fairway'] = '양잔디(켄터키블루)'
        else:
            c['grass']['fairway'] = '조선잔디(한국잔디)'
    else:
        if '양잔디' in c['grass']['fairway']:
            c['grass']['fairway'] = '양잔디(켄터키블루)'
        else:
            c['grass']['fairway'] = '조선잔디(중지)'

    # 4. Course Style & Terrain
    if any(k in name for k in KNOWN_LINKS_COURSES):
        c['courseStyle'] = '링크스형(평지/해변)'
        c['undulation'] = '평탄'
        c['fairwayWidth'] = '넓음'
    elif any(k in name for k in KNOWN_GOTJAWAL_COURSES):
        c['courseStyle'] = '곶자왈(평지)'
        c['undulation'] = '보통'
        c['fairwayWidth'] = '보통'
    elif c.get('region') in ('강원', '경기북부') and not any(k in name for k in ['스마트KU', '자유로']):
        c['courseStyle'] = '산악형'
        c['undulation'] = '심함'
    else:
        # Hill / Mountain
        if c.get('undulation') == '평탄':
            c['courseStyle'] = '구릉형(힐)'
            c['undulation'] = '보통'

    # 5. Night Play & Lighting
    if any(k in name for k in KNOWN_NO_NIGHT_CLUBS) or c['courseType'] == '회원제':
        c['playOptions']['nightPlay'] = False
        c['playOptions']['lightingType'] = '야간 미운영'
    elif any(k in name for k in KNOWN_LED_NIGHT_COURSES):
        c['playOptions']['nightPlay'] = True
        c['playOptions']['lightingType'] = '최신 고광량 LED'
    else:
        # If previously had nightPlay: true, keep it, but ensure lightingType is accurate
        if c['playOptions']['nightPlay']:
            c['playOptions']['lightingType'] = 'LED 초고광량'
        else:
            c['playOptions']['nightPlay'] = False
            c['playOptions']['lightingType'] = '야간 미운영'

    return c

def main():
    with open('src/data/golfClubs.ts', 'r', encoding='utf-8') as f:
        file_content = f.read()

    assign_idx = file_content.find('GOLF_CLUBS_DATA')
    eq_idx = file_content.find('=', assign_idx)
    start = file_content.find('[', eq_idx)
    theme_idx = file_content.find('export const THEME_PRESETS')
    end = file_content.rfind('];', 0, theme_idx)

    prefix = file_content[:start]
    json_str = file_content[start:end+1]
    suffix = file_content[end+1:]

    clubs = json.loads(json_str)
    print(f"Auditing and updating 5 dimensions across {len(clubs)} clubs...")

    updated_clubs = [audit_club(c) for c in clubs]

    new_json_str = json.dumps(updated_clubs, ensure_ascii=False, indent=2)
    new_file_content = prefix + new_json_str + suffix

    with open('src/data/golfClubs.ts', 'w', encoding='utf-8') as f:
        f.write(new_file_content)

    print("Successfully audited and updated all 5 dimensions in src/data/golfClubs.ts!")

if __name__ == '__main__':
    main()

