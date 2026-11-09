import json

with open('src/data/golfClubs.ts', 'r', encoding='utf-8') as f:
    content = f.read()

assign_idx = content.find('GOLF_CLUBS_DATA')
eq_idx = content.find('=', assign_idx)
start = content.find('[', eq_idx)
theme_idx = content.find('export const THEME_PRESETS')
end = content.rfind('];', 0, theme_idx)

clubs = json.loads(content[start:end+1])

with open('all_494_names.txt', 'w', encoding='utf-8') as f:
    for i, c in enumerate(clubs):
        f.write(f"[{i:3d}] ID: {c['id']:<25} | Name: {c['name']:<25} | Region: {c.get('region')} {c.get('city')}\n")

print('Written all 494 names to all_494_names.txt')

