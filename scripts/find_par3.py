import json

with open('src/data/golfClubs.ts', 'r', encoding='utf-8') as f:
    content = f.read()

assign_idx = content.find('GOLF_CLUBS_DATA')
eq_idx = content.find('=', assign_idx)
start = content.find('[', eq_idx)
theme_idx = content.find('export const THEME_PRESETS')
end = content.rfind('];', 0, theme_idx)

clubs = json.loads(content[start:end+1])

# Check all names
print(f"Total clubs: {len(clubs)}")

# Known Par 3 / driving range keywords
par3_clues = ['파3', 'par3', 'par 3', '숏코스', '미니골프', '연습장', '피칭', '어프로치']

par3_list = []
for c in clubs:
    name = c['name']
    cid = c['id']
    desc = c.get('description', '')
    high = c.get('highlight', '')
    addr = c.get('address', '')
    
    # Check 123, 서창, 제이퍼블릭, 스카이21, 인터불고 등
    if any(clue in name.lower() for clue in par3_clues):
        par3_list.append((c, 'name clue'))
    elif any(clue in desc.lower() for clue in par3_clues):
        par3_list.append((c, 'desc clue'))
    elif any(clue in high.lower() for clue in par3_clues):
        par3_list.append((c, 'high clue'))
    elif cid in ('123gc', '서창퍼블릭골프장', '제이퍼블릭골프클럽', '스카이21cc', '인터불고gc퍼블릭cc', '파인힐클럽하우스', '라데나골프클럽클럽하우스'):
        par3_list.append((c, 'manual id'))

print(f"Identified par3/duplicate candidates: {len(par3_list)}")
for c, r in par3_list:
    print(f"[{c['id']}] {c['name']} ({r}) - {c.get('region')} {c.get('city')}")
