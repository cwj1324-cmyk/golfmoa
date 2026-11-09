import json

def point_in_poly(x, y, poly):
    # poly is list of [lng, lat]
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(1, n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def test_ananti():
    with open('skorea-municipalities-2018-geo.json', 'r', encoding='utf-8') as f:
        geo = json.load(f)

    # Ananti Namhae: lat 34.77662, lng 127.85271
    px, py = 127.85271, 34.77662

    found = None
    for feat in geo['features']:
        geom = feat['geometry']
        gtype = geom['type']
        coords = geom['coordinates']
        name = feat['properties']['name']
        code = feat['properties']['code']
        
        hit = False
        if gtype == 'Polygon':
            if point_in_poly(px, py, coords[0]):
                hit = True
        elif gtype == 'MultiPolygon':
            for poly in coords:
                if point_in_poly(px, py, poly[0]):
                    hit = True
                    break
        if hit:
            found = (name, code)
            break

    print(f'Ananti Namhae point-in-poly result: {found}')

if __name__ == '__main__':
    test_inti = test_ananti()

