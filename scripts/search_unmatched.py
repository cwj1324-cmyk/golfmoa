import json

with open('src/data/golfClubs.ts', 'r', encoding='utf-8') as f:
    content = f.read()

assign_idx = content.find('GOLF_CLUBS_DATA')
eq_idx = content.find('=', assign_idx)
start = content.find('[', eq_idx)
theme_idx = content.find('export const THEME_PRESETS')
end = content.rfind('];', 0, theme_idx)

db_clubs = json.loads(content[start:end+1])

targets = [
    '88', '올데이', '벨라', '금강', '큐로', '엘리시안', '해비치', '한맥', '힐마루', 
    '제이드', '장수', '라데나', '라싸', '스카이힐', '김해', '휘닉스', '파인비치', 
    '파인스톤', '용인', '프리스틴', '한양', '샤인빌', '72', '스마트', '사우스케이프', 
    '더골프', '트리니티', '베르힐', '용원'
]

for t in targets:
    found = [c['name'] for c in db_clubs if t.lower() in c['name'].lower()]
    print(f"Target '{t}': {found}")
