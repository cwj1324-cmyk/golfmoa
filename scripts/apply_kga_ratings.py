import json
import re
from collections import defaultdict
from kga_mappings import KGA_EXTRA_MAPPINGS

def normalize(s):
    if not s:
        return ''
    s = re.sub(r'\(.*?\)', '', s)
    s = re.sub(r'\[.*?\]', '', s)
    for w in ['골프앤리조트', '골프&리조트', '컨트리클럽', '골프클럽', '골프장', '칸트리클럽', '칸트리구락부', '리조트', 'CC', 'GC', 'cc', 'gc']:
        s = s.replace(w, '')
    s = re.sub(r'[^0-9a-zA-Z가-힣]', '', s)
    return s.lower()

def compute_relative_difficulty(slope):
    if slope is None:
        return '미측정'
    if slope < 120:
        return '쉬움(초보추천)'
    elif slope <= 129:
        return '보통(표준)'
    elif slope <= 136:
        return '어려움(중상급)'
    else:
        return '지옥(상급자전용)'

def main():
    with open('kga_extracted.json', 'r', encoding='utf-8') as f:
        kga_data = json.load(f)

    # 1. Parse KGA clubs
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

    # Calculate representative ratings for each KGA club
    kga_summaries = {}
    for club, courses in clubs_data.items():
        course_crs = []
        course_srs = []
        for cname, entries in courses.items():
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

    # Load golfClubs.ts
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

    db_clubs = json.loads(json_str)
    print(f'Total DB clubs loaded: {len(db_clubs)}')

    db_by_id = {c['id']: c for c in db_clubs}
    db_by_name = {c['name']: c for c in db_clubs}
    db_by_norm = {normalize(c['name']): c for c in db_clubs}

    # Track which db_club receives which KGA rating
    applied_ratings = {}

    # Special handling for Club 72
    # Hanul -> 클럽72CC 하늘코스 (CR 71.4, SR 134)
    # Ocean -> 클럽72CC 바다코스 (오션·레이크·클래식) (CR 71.0, SR 130)
    for c in db_clubs:
        if '클럽72CC 하늘코스' in c['name']:
            applied_ratings[c['id']] = {
                'cr': 71.4,
                'sr': 134,
                'kga_name': '클럽 72 - HANUL'
            }
        elif '클럽72CC 바다코스' in c['name']:
            applied_ratings[c['id']] = {
                'cr': 71.0,
                'sr': 130,
                'kga_name': '클럽 72 - OCEAN'
            }

    # Match each KGA club
    for kga_club, s in kga_summaries.items():
        if kga_club == '아난티 클럽 제주':
            # Do not match to central Ananti
            continue

        target_db_club = None
        if kga_club in KGA_EXTRA_MAPPINGS:
            alias_name = KGA_EXTRA_MAPPINGS[kga_club]
            target_db_club = db_by_name.get(alias_name)
            if not target_db_club:
                target_db_club = db_by_norm.get(normalize(alias_name))

        if not target_db_club:
            knorm = normalize(kga_club)
            if knorm in db_by_norm:
                target_db_club = db_by_norm[knorm]
            else:
                for norm, c in db_by_norm.items():
                    if len(knorm) >= 2 and len(norm) >= 2:
                        if knorm == norm:
                            target_db_club = c
                            break
                        if (knorm + 'cc') == norm or norm == (knorm + 'cc'):
                            target_db_club = c
                            break

        if target_db_club:
            # avoid overwriting special club 72
            if target_db_club['id'] not in applied_ratings:
                applied_ratings[target_db_club['id']] = {
                    'cr': s['courseRating'],
                    'sr': s['slopeRating'],
                    'kga_name': kga_club
                }

    print(f'Total clubs to receive official KGA ratings: {len(applied_ratings)}')

    # Apply updates to db_clubs
    updated_count = 0
    for c in db_clubs:
        cid = c['id']
        # Fix 클럽디거창 region if needed
        if '클럽디거창' in c['name']:
            c['region'] = '경상'

        if cid in applied_ratings:
            info = applied_ratings[cid]
            c['difficultyIndex']['courseRating'] = info['cr']
            c['difficultyIndex']['slopeRating'] = info['sr']
            c['difficultyIndex']['relativeDifficulty'] = compute_relative_difficulty(info['sr'])
            updated_count += 1
        else:
            # Unrated club: keep slopeRating and courseRating null, relativeDifficulty '미측정'
            # Do NOT guess or invent numbers
            c['difficultyIndex']['courseRating'] = None
            c['difficultyIndex']['slopeRating'] = None
            c['difficultyIndex']['relativeDifficulty'] = '미측정'

    print(f'Successfully updated {updated_count} clubs with verified KGA official ratings!')
    print(f'Remaining {len(db_clubs) - updated_count} clubs marked as unrated (미측정).')

    # Format JSON nicely
    new_json_str = json.dumps(db_clubs, ensure_ascii=False, indent=2)
    # Write back to src/data/golfClubs.ts
    new_file_content = prefix + new_json_str + suffix

    with open('src/data/golfClubs.ts', 'w', encoding='utf-8') as f:
        f.write(new_file_content)

    print('Updated src/data/golfClubs.ts successfully!')

if __name__ == '__main__':
    main()

