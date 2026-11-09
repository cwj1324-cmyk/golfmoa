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
print(f"Total clubs to inspect: {len(clubs)}\n")

# 1. courseType
print("1. CourseType Distribution:")
print(Counter(c.get('courseType') for c in clubs))

# 2. teeBoxMatRatio
print("\n2. TeeBoxMatRatio Distribution:")
print(Counter(c.get('teeBoxMatRatio') for c in clubs))

# 3. Fairway Grass
print("\n3. Fairway Grass Distribution:")
print(Counter(c['grass']['fairway'] for c in clubs))

# 4. Course Style
print("\n4. Course Style Distribution:")
print(Counter(c.get('courseStyle') for c in clubs))
print("Undulation Distribution:")
print(Counter(c.get('undulation') for c in clubs))
print("Fairway Width Distribution:")
print(Counter(c.get('fairwayWidth') for c in clubs))

# 5. Night Play & Lighting
print("\n5. Night Play Distribution:")
print(Counter(c['playOptions']['nightPlay'] for c in clubs))
print("Lighting Type Distribution:")
print(Counter(c['playOptions']['lightingType'] for c in clubs))
