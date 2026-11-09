import json

with open('src/data/golfClubs.ts', 'r', encoding='utf-8') as f:
    file_content = f.read()

assign_idx = file_content.find('GOLF_CLUBS_DATA')
eq_idx = file_content.find('=', assign_idx)
start = file_content.find('[', eq_idx)
theme_idx = file_content.find('export const THEME_PRESETS')
end = file_content.rfind('];', 0, theme_idx)

prefix = file_content[:start]
json_str = file_content[start:end+1]
suffix = file_content[end+1:]

clubs = json.loads(json_str)
initial_count = len(clubs)
print(f"Initial clubs: {initial_count}")

# IDs to remove:
# 1. Par 3 / Short game courses:
#    - '123gc': 123 GC (고양시 6홀 파3)
#    - '서창퍼블릭골프장': 서창퍼블릭골프장 (광주시 파3 골프연습장)
#    - '제이퍼블릭골프클럽': 제이퍼블릭골프클럽 (파주시 6홀 숏코스)
#    - '스카이21cc': 스카이21CC (청주시 9홀 파3)
#    - '인터불고gc퍼블릭cc': 인터불고GC(퍼블릭)CC (원주 호텔 내 파3 숏코스)
#    - '화이트그린랜드whitegreenlandcc': 화이트그린랜드 (부산 파3/연습장)
# 2. Duplicate / Clubhouse POIs:
#    - '라데나골프클럽클럽하우스': 라데나 클럽하우스 중복
#    - '파인힐클럽하우스': 파인힐 클럽하우스 중복
#    - '아덴힐리즈트앤골프클럽': 아덴힐 오타 중복 (아덴힐리조트앤골프클럽 유지)
#    - '태디밸리골프리조트': 테디밸리 오타 중복 (테디밸리 골프&리조트 유지)
#    - '타미우스골프클럽': 타미우스 중복 (KGA 공인 타미우스GC 유지)
#    - '라온골프클럽': 라온 중복 (KGA 공인 라온GC 유지)
#    - 'everisgolfresortcc': 에버리스 중복 (KGA 공인 에버리스CC 유지)
#    - '세일골프클럽': 세일 중복 (세일CC 유지)
#    - '오렌지듄스영종gc': 오렌지듄스 영종 중복 (인천 중구 오렌지듄스 영종GC 유지)

REMOVE_IDS = {
    '123gc',
    '서창퍼블릭골프장',
    '제이퍼블릭골프클럽',
    '스카이21cc',
    '인터불고gc퍼블릭cc',
    '화이트그린랜드whitegreenlandcc',
    '라데나골프클럽클럽하우스',
    '파인힐클럽하우스',
    '아덴힐리즈트앤골프클럽',
    '태디밸리골프리조트',
    '타미우스골프클럽',
    '라온골프클럽',
    'everisgolfresortcc',
    '세일골프클럽',
    '오렌지듄스영종gc'
}

filtered_clubs = [c for c in clubs if c['id'] not in REMOVE_IDS]
removed_count = initial_count - len(filtered_clubs)
print(f"Removed: {removed_count} clubs")
print(f"Remaining genuine green-grass clubs: {len(filtered_clubs)}")

new_json_str = json.dumps(filtered_clubs, ensure_ascii=False, indent=2)
new_file_content = prefix + new_json_str + suffix

with open('src/data/golfClubs.ts', 'w', encoding='utf-8') as f:
    f.write(new_file_content)

print("Saved cleanly to src/data/golfClubs.ts!")

