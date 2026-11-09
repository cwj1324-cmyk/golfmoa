import json
from collections import Counter

with open('src/data/golfClubs.ts', 'r', encoding='utf-8') as f:
    content = f.read()

assign_idx = content.find('GOLF_CLUBS_DATA')
eq_idx = content.find('=', assign_idx)
start = content.find('[', eq_idx)
theme_idx = content.find('export const THEME_PRESETS')
end = content.rfind('];', 0, theme_idx)

clubs = json.loads(content[start:end+1])

holes_counter = Counter(c.get('holes', 18) for c in clubs)
print('Holes distribution:', holes_counter)

print('\nClubs with holes != 18, 27, 36, 45, 54, 72:')
for c in clubs:
    h = c.get('holes', 18)
    if h < 18 or h not in (18, 27, 36, 45, 54, 72):
        print(f"ID: {c['id']} | Name: {c['name']} | Holes: {h} | Length: {c.get('totalLengthMeters')}m | Region: {c.get('region')} | City: {c.get('city')}")

