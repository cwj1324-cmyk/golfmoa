import json
import re

def verify():
    with open('kga_final_matches.json', 'r', encoding='utf-8') as f:
        matches = json.load(f)

    with open('src/data/golfClubs.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    assign_idx = content.find('GOLF_CLUBS_DATA')
    eq_idx = content.find('=', assign_idx)
    start = content.find('[', eq_idx)
    theme_idx = content.find('export const THEME_PRESETS')
    end = content.rfind('];', 0, theme_idx)

    db_clubs = {c['id']: c for c in json.loads(content[start:end+1])}

    for cid, m in list(matches.items()):
        kga = m['kga_name']
        db_c = db_clubs.get(cid)
        db_name = db_c['name']
        
        # Check suspicious
        k_clean = re.sub(r'[^가-힣0-9a-zA-Z]', '', kga).lower()
        d_clean = re.sub(r'[^가-힣0-9a-zA-Z]', '', db_name).lower()
        
        # Common false positives
        if '아난티' in k_clean and '제주' in k_clean and '제주' not in d_clean:
            print(f"FLAGGED: KGA '{kga}' vs DB '{db_name}' ({db_c['region']})")
        elif k_clean not in d_clean and d_clean not in k_clean:
            print(f"DIFF: KGA '{kga}' vs DB '{db_name}'")

if __name__ == '__main__':
    verify()
