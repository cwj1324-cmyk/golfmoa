import json

with open('kga_final_matches.json', 'r', encoding='utf-8') as f:
    matched = json.load(f)

with open('unmatched_kga.json', 'r', encoding='utf-8') as f:
    unmatched = json.load(f)

matched_kga_names = {m['kga_name'] for m in matched.values()}

print('Remaining unmatched KGA clubs:')
for u, s in unmatched:
    if u not in matched_kga_names and u != '아난티 클럽 제주':
        print(f"  {u:25} -> CR {s['courseRating']} / SR {s['slopeRating']}")
