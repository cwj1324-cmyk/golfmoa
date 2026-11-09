import json
import math

# Load GeoJSON
with open('skorea-municipalities-2018-geo.json', 'r', encoding='utf-8') as f:
    geo = json.load(f)

# Precompute bounding boxes for each feature to accelerate search
features = []
for feat in geo['features']:
    props = feat['properties']
    geom = feat['geometry']
    gtype = geom['type']
    coords = geom['coordinates']
    
    # Calculate bbox
    min_x = 999
    max_x = -999
    min_y = 999
    max_y = -999
    
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

PROVINCE_MAP = {
    '11': '서울',
    '21': '부산',
    '22': '대구',
    '23': '인천',
    '24': '광주',
    '25': '대전',
    '26': '울산',
    '29': '세종',
    '31': '경기',
    '32': '강원',
    '33': '충북',
    '34': '충남',
    '35': '전북',
    '36': '전남',
    '37': '경북',
    '38': '경남',
    '39': '제주'
}

def determine_region_from_kostat(code, muni_name, lat, lng):
    prefix = code[:2]
    prov = PROVINCE_MAP.get(prefix, '')
    
    if prefix == '23':
        return '인천', prov, muni_name
    elif prefix == '39':
        return '제주', prov, muni_name
    elif prefix == '32':
        return '강원', prov, muni_name
    elif prefix in ('33', '34', '25', '29'): # 충북, 충남, 대전, 세종
        return '충청', prov, muni_name
    elif prefix in ('35', '36', '24'): # 전북, 전남, 광주
        return '전라', prov, muni_name
    elif prefix in ('37', '38', '21', '22', '26'): # 경북, 경남, 부산, 대구, 울산
        return '경상', prov, muni_name
    elif prefix == '31': # 경기도
        # check if northern or southern
        for nc in NORTH_GYEONGGI_CITIES:
            if nc in muni_name:
                return '경기북부', prov, muni_name
        return '경기남부', prov, muni_name
    elif prefix == '11': # 서울
        if '강서' in muni_name or '구로' in muni_name or '양천' in muni_name:
            return '인천', prov, muni_name # Inseoul27 / Gimpo border
        elif lat >= 37.58:
            return '경기북부', prov, muni_name
        else:
            return '경기남부', prov, muni_name
    return '경기남부', prov, muni_name

def find_muni(lng, lat):
    # 1. Exact point in poly
    candidates = []
    for f in features:
        bx1, by1, bx2, by2 = f['bbox']
        if bx1 <= lng <= bx2 and by1 <= lat <= by2:
            candidates.append(f)
            
    for f in candidates:
        for poly in f['polys']:
            if point_in_poly(lng, lat, poly):
                return f['code'], f['name']
                
    # 2. Nearest feature center if slightly offshore or border
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

def main():
    with open('src/data/golfClubs.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    assign_idx = content.find('GOLF_CLUBS_DATA')
    eq_idx = content.find('=', assign_idx)
    start = content.find('[', eq_idx)
    theme_idx = content.find('export const THEME_PRESETS')
    end = content.rfind('];', 0, theme_idx)

    db_clubs = json.loads(content[start:end+1])
    print(f'Auditing {len(db_clubs)} clubs...')

    mismatches = []
    for c in db_clubs:
        lat = c['coordinates']['lat']
        lng = c['coordinates']['lng']
        curr_reg = c['region']
        
        code, muni = find_muni(lng, lat)
        true_reg, prov, muni_name = determine_region_from_kostat(code, muni, lat, lng)
        
        if curr_reg != true_reg:
            mismatches.append({
                'id': c['id'],
                'name': c['name'],
                'current_region': curr_reg,
                'true_region': true_reg,
                'prov': prov,
                'muni': muni_name,
                'lat': lat,
                'lng': lng,
                'address': c['address']
            })

    print(f'\nTotal Region Mismatches Found: {len(mismatches)}')
    for m in mismatches:
        print(f"[{m['name']}] Current: '{m['current_region']}' -> TRUE: '{m['true_region']}' ({m['prov']} {m['muni']}) | lat: {m['lat']}, lng: {m['lng']}")

    with open('region_mismatches.json', 'w', encoding='utf-8') as f:
        json.dump(mismatches, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    main()
