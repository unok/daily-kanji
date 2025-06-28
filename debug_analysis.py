import json
from pathlib import Path

# 分析結果を読み込む
with open('grade4_problems_analysis.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# すべての問題を確認
all_problems = data['problems_to_fix']

print(f"総問題数: {len(all_problems)}")
print(f"needs_fix=True: {sum(1 for p in all_problems if p['needs_fix'])}")
print(f"needs_fix=False: {sum(1 for p in all_problems if not p['needs_fix'])}")

# needs_fix=Falseの問題を表示
no_fix = [p for p in all_problems if not p['needs_fix']]
if no_fix:
    print("\n修正不要な問題:")
    for p in no_fix[:5]:
        print(f"- {p['id']}: {p['sentence']}")
        print(f"  理由: {p['fix_reason']}")
else:
    print("\n修正不要な問題はありません。")

# 熟語の例を確認
print("\n熟語の例（最初の10件）:")
for p in all_problems[:20]:
    if len(p['target_kanji']) > 1:
        print(f"- {p['id']}: {p['sentence']}")
        print(f"  対象漢字: {p['target_kanji']}")
        print(f"  問題の漢字: {p['problematic_kanji']}")
        print(f"  修正必要: {p['needs_fix']}, 理由: {p['fix_reason']}")
