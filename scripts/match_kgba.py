import json
import re

def normalize(name):
    name = re.sub(r'\(.*?\)', '', name)
    name = re.sub(r'\[.*?\]', '', name)
    for kw in ['골프앤리조트', '골프&리조트', '컨트리클럽', '골프클럽', '골프장', 'CC', 'GC', 'cc', 'gc', ' ']:
        name = name.replace(kw, '')
    return name.lower()

with open('kgba_raw.json', 'r', encoding='utf-8') as f:
    kgba = json.load(f)

with open('src/data/golfClubs.ts', 'r', encoding='utf-8') as f:
    content = f.read()

assign_idx = content.find('GOLF_CLUBS_DATA')
eq_idx = content.find('=', assign_idx)
start = content.find('[', eq_idx)
theme_idx = content.find('export const THEME_PRESETS')
end = content.rfind('];', 0, theme_idx)

clubs = json.loads(content[start:end+1])

db_by_norm = {normalize(c['name']): c for c in clubs}

matched = []
unmatched = []

for k in kgba:
    knorm = normalize(k['name'])
    found = db_by_norm.get(knorm)
    if not found:
        for dnorm, c in db_by_norm.items():
            if len(knorm) >= 2 and (knorm == dnorm or knorm in dnorm or dnorm in knorm):
                found = c
                break
    if found:
        matched.append((k['name'], found['name'], found['id']))
    else:
        unmatched.append(k['name'])

print(f"Matched KGBA clubs: {len(matched)} / {len(kgba)}")
print(f"Unmatched KGBA clubs: {len(unmatched)}")
