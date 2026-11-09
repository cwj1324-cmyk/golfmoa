import json

with open('src/data/golfClubs.ts', 'r', encoding='utf-8') as f:
    content = f.read()

assign_idx = content.find('GOLF_CLUBS_DATA')
eq_idx = content.find('=', assign_idx)
start = content.find('[', eq_idx)
theme_idx = content.find('export const THEME_PRESETS')
end = content.rfind('];', 0, theme_idx)

clubs = json.loads(content[start:end+1])

print('Total clubs:', len(clubs))
for i, c in enumerate(clubs):
    name = c['name']
    cid = c['id']
    # Check suspicious or practice names
    if any(k in name for k in ['123', '연습', '파3', '숏코스', '미니', '아카데미', '퍼블릭', '클럽하우스', '골프랜드', '조선', '스카이21']):
        print(f"[{i}] {name} ({cid}) - {c.get('region')} {c.get('city')}")
