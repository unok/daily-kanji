import json

with open('grade4_problems_analysis.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 修正不要な問題を確認
no_fix_problems = [p for p in data['problems_to_fix'] if not p['needs_fix']]

print(f"修正不要な問題（熟語ルール適用）: {len(no_fix_problems)}件\n")

for i, problem in enumerate(no_fix_problems, 1):
    print(f"{i}. {problem['id']}: {problem['sentence']}")
    print(f"   対象漢字: {problem['target_kanji']}")
    print(f"   問題の漢字: {problem['problematic_kanji']}")
    print()
