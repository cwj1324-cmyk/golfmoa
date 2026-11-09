import urllib.request
import urllib.parse
import json

overpass_url = 'https://overpass-api.de/api/interpreter'
overpass_query = """
[out:json][timeout:35];
area["ISO3166-1"="KR"][admin_level=2]->.korea;
(
  node["leisure"="golf_course"](area.korea);
  way["leisure"="golf_course"](area.korea);
  relation["leisure"="golf_course"](area.korea);
);
out center tags;
"""

print("Querying Overpass API for Korea golf courses...")
req = urllib.request.Request(
    overpass_url, 
    data=urllib.parse.urlencode({'data': overpass_query}).encode('utf-8'),
    headers={'User-Agent': 'GolfMoaCollector/1.0'}
)

try:
    with urllib.request.urlopen(req, timeout=40) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        elements = res.get('elements', [])
        print(f"Total OSM elements found: {len(elements)}")
        
        valid_courses = []
        seen_names = set()
        
        for e in elements:
            tags = e.get('tags', {})
            name = tags.get('name') or tags.get('name:ko')
            if not name:
                continue
            
            # Clean name (remove duplicates)
            name_clean = name.strip()
            if name_clean in seen_names or len(name_clean) < 2:
                continue
            seen_names.add(name_clean)
            
            lat = e.get('lat') or e.get('center', {}).get('lat')
            lng = e.get('lon') or e.get('center', {}).get('lon')
            if not lat or not lng:
                continue
                
            valid_courses.append({
                'name': name_clean,
                'lat': lat,
                'lng': lng,
                'tags': tags
            })
            
        print(f"Distinct named golf courses with coordinates: {len(valid_courses)}")
        with open('osm_golf_courses.json', 'w', encoding='utf-8') as f:
            json.dump(valid_courses, f, ensure_ascii=False, indent=2)
        print("Saved to osm_golf_courses.json")
except Exception as e:
    print("Error querying Overpass API:", e)

