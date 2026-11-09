import json

with open('src/data/golfClubs.ts', 'r', encoding='utf-8') as f:
    content = f.read()

assign_idx = content.find('GOLF_CLUBS_DATA')
eq_idx = content.find('=', assign_idx)
start = content.find('[', eq_idx)
theme_idx = content.find('export const THEME_PRESETS')
end = content.rfind('];', 0, theme_idx)

db_clubs = json.loads(content[start:end+1])

sample_addrs = [c['address'] for c in db_clubs]
print('Unique addresses sample (first 30):')
for a in list(set(sample_addrs))[:30]:
    print(f"'{a}'")

