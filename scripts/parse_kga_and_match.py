import json
import re
from collections import defaultdict

def normalize(s):
    if not s:
        return ''
    s = re.sub(r'\(.*?\)', '', s)
    s = re.sub(r'\[.*?\]', '', s)
    for w in ['골프앤리조트', '골프&리조트', '컨트리클럽', '골프클럽', '골프장', '칸트리클럽', '칸트리구락부', '리조트', 'CC', 'GC', 'cc', 'gc']:
        s = s.replace(w, '')
    s = re.sub(r'[^0-9a-zA-Z가-힣]', '', s)
    return s.lower()

# Aliases for KGA club names to DB names or keywords
KGA_ALIASES = {
    '센츄리 21': '센추리21CC',
    '클럽 D 보은': '클럽디보은CC',
    '클럽 D 거창': '클럽디거창CC',
    '클럽 D 속리산': '클럽디속리산',
    '동래 베네스트': '동래배네스트CC',
    '김천 포도': '포도CC',
    '김포시사이드': '김포 씨사이드 CC',
    '골프존카운티 오라': '오라CC',
    '이천 마이다스': '마이다스레이크이천 골프앤리조트',
    '도고': '도고칸트리구락부CC',
    '페럼': '페럼클럽',
    '고창': '고창칸트리클럽',
    '아난티 클럽 제주': '아난티 중앙 골프클럽', # wait, check if Jeju or other
    '가평 베네스트': '가평베네스트GC',
    '안성 베네스트': '안성베네스트골프클럽',
    '베어크리크 춘천': '베어크리크GC 춘천CC',
    '베어크리크': '베어크리크G.CCC',
    '블루원 디아너스': '블루원 디아너스 CC',
    '블루원용인': '블루원용인CC',
    '블루원상주': '블루원상주CC',
    '골프존카운티 드래곤': '골프존카운티 드래곤CC',
    '골프존카운티 사천': '골프존카운티 사천CC',
    '골프존카운티 선산': '골프존카운티 선산CC',
    '골프존카운티 선운': '골프존카운티 선운CC',
    '골프존카운티 안성 H': '골프존카운티 안성H',
    '골프존카운티 진천': '골프존카운티 진천CC',
    '골프존카운티 천안': '골프존카운티 천안CC',
}

def main():
    with open('kga_extracted.json', 'r', encoding='utf-8') as f:
        kga_data = json.load(f)

    with open('src/data/golfClubs.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    assign_idx = content.find('GOLF_CLUBS_DATA')
    eq_idx = content.find('=', assign_idx)
    start = content.find('[', eq_idx)
    theme_idx = content.find('export const THEME_PRESETS')
    end = content.rfind('];', 0, theme_idx)

    db_clubs = json.loads(content[start:end+1])

    # Parse KGA clubs
    clubs_data = defaultdict(lambda: defaultdict(list))
    for r in kga_data:
        raw = r['raw_club_course'].replace('골프장 / 코스', '').replace('골프장/코스', '').strip()
        if not raw:
            continue
        course = '기본'
        club = raw
        if ' - ' in raw:
            parts = raw.split(' - ')
            club = parts[0].strip()
            course = ' - '.join(parts[1:]).strip()
        elif '-' in raw:
            parts = raw.split('-')
            club = parts[0].strip()
            course = '-'.join(parts[1:]).strip()

        club = re.sub(r'\s+', ' ', club).strip()
        course = re.sub(r'\s+', ' ', course).strip()

        clubs_data[club][course].append({
            'tee': r['tee'].strip(),
            'gender': r['gender'].strip(),
            'cr': r['course_rating'],
            'sr': r['slope_rating']
        })

    kga_summaries = {}
    for club, courses in clubs_data.items():
        course_crs = []
        course_srs = []
        for cname, entries in courses.items():
            # Find male white/regular
            found = False
            for e in entries:
                t_up = e['tee'].upper()
                gen = e['gender']
                if gen == '남자' and ('WHITE' in t_up or 'REGULAR' in t_up or '화이트' in t_up or '레귤러' in t_up):
                    course_crs.append(e['cr'])
                    course_srs.append(e['sr'])
                    found = True
                    break
            if not found:
                male_entries = [e for e in entries if e['gender'] == '남자']
                if male_entries:
                    male_entries.sort(key=lambda x: x['cr'])
                    mid = male_entries[len(male_entries)//2]
                    course_crs.append(mid['cr'])
                    course_srs.append(mid['sr'])

        if course_crs:
            kga_summaries[club] = {
                'courseRating': round(sum(course_crs) / len(course_crs), 1),
                'slopeRating': round(sum(course_srs) / len(course_srs)),
                'courses': list(courses.keys())
            }

    # Match against db_clubs
    db_by_id = {c['id']: c for c in db_clubs}
    db_by_name = {c['name']: c for c in db_clubs}
    db_by_norm = {normalize(c['name']): c for c in db_clubs}

    matched = {}

    for kga_club, s in kga_summaries.items():
        # Check alias first
        target_db_club = None
        if kga_club in KGA_ALIASES:
            alias_name = KGA_ALIASES[kga_club]
            target_db_club = db_by_name.get(alias_name)
            if not target_db_club:
                target_db_club = db_by_norm.get(normalize(alias_name))

        if not target_db_club:
            # Check norm
            knorm = normalize(kga_club)
            if knorm in db_by_norm:
                target_db_club = db_by_norm[knorm]
            else:
                # Substring match
                for norm, c in db_by_norm.items():
                    if len(knorm) >= 2 and len(norm) >= 2:
                        if knorm == norm:
                            target_db_club = c
                            break
                        # e.g. 남부 -> 남부CC
                        if (knorm + 'cc') == norm or norm == (knorm + 'cc'):
                            target_db_club = c
                            break

        if target_db_club:
            matched[target_db_club['id']] = {
                'club_id': target_db_club['id'],
                'club_name': target_db_club['name'],
                'kga_name': kga_club,
                'courseRating': s['courseRating'],
                'slopeRating': s['slopeRating']
            }

    print(f'Total KGA clubs: {len(kga_summaries)}')
    print(f'Total matched in DB: {len(matched)}')
    
    # Let's inspect matched items
    print('\nMatched sample (20 items):')
    for m in list(matched.values())[:20]:
        print(f"  {m['club_name']} (KGA: {m['kga_name']}) -> CR {m['courseRating']} / SR {m['slopeRating']}")

    with open('kga_final_matches.json', 'w', encoding='utf-8') as f:
        json.dump(matched, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    main()
