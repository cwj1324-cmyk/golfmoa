import json
import re

with open('skorea-municipalities-2018-geo.json', 'r', encoding='utf-8') as f:
    geo = json.load(f)

features = []
for feat in geo['features']:
    props = feat['properties']
    geom = feat['geometry']
    gtype = geom['type']
    coords = geom['coordinates']
    
    min_x = 999; max_x = -999; min_y = 999; max_y = -999
    polys = []
    if gtype == 'Polygon':
        polys.append(coords[0])
    elif gtype == 'MultiPolygon':
        for p in coords:
            polys.append(p[0])
            
    for p in polys:
        for x, y in p:
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y
            
    features.append({
        'name': props['name'],
        'code': props['code'],
        'bbox': (min_x, min_y, max_x, max_y),
        'polys': polys
    })

def point_in_poly(x, y, poly):
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(1, n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

NORTH_GYEONGGI_CITIES = {
    '고양시', '의정부시', '남양주시', '파주시', '구리시', '포천시', '양주시', '동두천시', '가평군', '연천군'
}

PROVINCE_FULL = {
    '11': '서울특별시',
    '21': '부산광역시',
    '22': '대구광역시',
    '23': '인천광역시',
    '24': '광주광역시',
    '25': '대전광역시',
    '26': '울산광역시',
    '29': '세종특별자치시',
    '31': '경기도',
    '32': '강원특별자치도',
    '33': '충청북도',
    '34': '충청남도',
    '35': '전북특별자치도',
    '36': '전라남도',
    '37': '경상북도',
    '38': '경상남도',
    '39': '제주특별자치도'
}

def clean_muni_name(raw):
    # e.g. '용인시처인구' -> '용인시 처인구'
    m = re.match(r'^(.+?시)(.+?구)$', raw)
    if m:
        return f"{m.group(1)} {m.group(2)}"
    return raw

def get_short_city(muni_name):
    # e.g. '용인시 처인구' -> '용인시' or '남해군' -> '남해군'
    if ' ' in muni_name:
        return muni_name.split(' ')[0]
    return muni_name

def find_muni(lng, lat):
    candidates = []
    for f in features:
        bx1, by1, bx2, by2 = f['bbox']
        if bx1 <= lng <= bx2 and by1 <= lat <= by2:
            candidates.append(f)
            
    for f in candidates:
        for poly in f['polys']:
            if point_in_poly(lng, lat, poly):
                return f['code'], f['name']
                
    # Fallback to nearest
    min_dist = 999999
    best_f = None
    for f in features:
        bx1, by1, bx2, by2 = f['bbox']
        cx = (bx1 + bx2) / 2
        cy = (by1 + by2) / 2
        dist = (cx - lng)**2 + (cy - lat)**2
        if dist < min_dist:
            min_dist = dist
            best_f = f
    if best_f:
        return best_f['code'], best_f['name']
    return '31', '경기도'

def determine_region(code, muni_name, lat, lng):
    prefix = code[:2]
    if prefix == '23':
        return '인천'
    elif prefix == '39':
        return '제주'
    elif prefix == '32':
        return '강원'
    elif prefix in ('33', '34', '25', '29'):
        return '충청'
    elif prefix in ('35', '36', '24'):
        return '전라'
    elif prefix in ('37', '38', '21', '22', '26'):
        return '경상'
    elif prefix == '31':
        for nc in NORTH_GYEONGGI_CITIES:
            if nc in muni_name:
                return '경기북부'
        return '경기남부'
    elif prefix == '11':
        if '강서' in muni_name or '구로' in muni_name or '양천' in muni_name:
            return '인천' # Airport boundary
        elif lat >= 37.58:
            return '경기북부'
        else:
            return '경기남부'
    return '경기남부'

def clean_address(curr_addr, prov_full, muni_formatted):
    # If curr_addr is empty or '대한민국'
    if not curr_addr or curr_addr.strip() == '대한민국':
        return f"{prov_full} {muni_formatted}"
    
    # Strip leading 대한민국
    addr = re.sub(r'^대한민국\s*', '', curr_addr.strip())
    
    # If already starts with full province
    if addr.startswith(prov_full):
        return addr
        
    # If starts with short prov (경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주)
    short_provs = ['경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종']
    for sp in short_provs:
        if addr.startswith(sp + ' '):
            addr = addr[len(sp)+1:].strip()
            break
            
    # Check if muni already in addr
    short_muni = get_short_city(muni_formatted)
    if short_muni in addr:
        return f"{prov_full} {addr}".strip()
    else:
        return f"{prov_full} {muni_formatted} {addr}".strip()

def test_run():
    with open('src/data/golfClubs.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    assign_idx = content.find('GOLF_CLUBS_DATA')
    eq_idx = content.find('=', assign_idx)
    start = content.find('[', eq_idx)
    theme_idx = content.find('export const THEME_PRESETS')
    end = content.rfind('];', 0, theme_idx)

    db_clubs = json.loads(content[start:end+1])
    print(f'Testing on {len(db_clubs)} clubs...')

    samples = []
    region_changes = 0

    for c in db_clubs:
        lat = c['coordinates']['lat']
        lng = c['coordinates']['lng']
        old_reg = c['region']
        old_addr = c['address']
        
        code, raw_muni = find_muni(lng, lat)
        prov_full = PROVINCE_FULL.get(code[:2], '대한민국')
        muni_formatted = clean_muni_name(raw_muni)
        short_city = get_short_city(muni_formatted)
        new_reg = determine_region(code, muni_formatted, lat, lng)
        new_addr = clean_address(old_addr, prov_full, muni_formatted)
        
        if old_reg != new_reg:
            region_changes += 1
            
        c['region'] = new_reg
        c['city'] = short_city
        c['address'] = new_addr

    print(f'Total region changes: {region_changes}')
    print('\nSample updated clubs (Ananti Namhae & others):')
    for c in db_clubs:
        if '아난티' in c['name'] or '골든베이' in c['name'] or '성문안' in c['name'] or '안성CC' in c['name'] or '블루원상주' in c['name']:
            print(f"[{c['name']}] Region: {c['region']} | City: {c['city']} | Address: {c['address']}")

if __name__ == '__main__':
    test_run()

