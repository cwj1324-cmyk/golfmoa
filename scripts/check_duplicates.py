import json
from collections import defaultdict
import math

with open('src/data/golfClubs.ts', 'r', encoding='utf-8') as f:
    content = f.read()

assign_idx = content.find('GOLF_CLUBS_DATA')
eq_idx = content.find('=', assign_idx)
start = content.find('[', eq_idx)
theme_idx = content.find('export const THEME_PRESETS')
end = content.rfind('];', 0, theme_idx)

clubs = json.loads(content[start:end+1])

print(f"Total clubs: {len(clubs)}")

# 1. Coordinate distance duplicates (within 500m)
coord_dupes = []
for i in range(len(clubs)):
    for j in range(i + 1, len(clubs)):
        c1 = clubs[i]
        c2 = clubs[j]
        lat1, lng1 = c1['coordinates']['lat'], c1['coordinates']['lng']
        lat2, lng2 = c2['coordinates']['lat'], c2['coordinates']['lng']
        
        # dist approx
        dlat = (lat1 - lat2) * 111000
        dlng = (lng1 - lng2) * 88000
        dist = math.sqrt(dlat*dlat + dlng*dlng)
        if dist < 800:
            coord_dupes.append((dist, c1['name'], c2['name'], c1['id'], c2['id']))

print(f"\nPotential coordinate duplicates (within 800m): {len(coord_dupes)}")
for d in coord_dupes:
    print(f"{d[0]:.0f}m: '{d[1]}' vs '{d[2]}' ({d[3]} vs {d[4]})")
