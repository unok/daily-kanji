import json

with open('grade4_problems_analysis.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

all_problems = data['problems_to_fix']
print(f"全問題数: {len(all_problems)}")

# needs_fixの値を確認
true_count = sum(1 for p in all_problems if p['needs_fix'] == True)
false_count = sum(1 for p in all_problems if p['needs_fix'] == False)

print(f"needs_fix=True: {true_count}")
print(f"needs_fix=False: {false_count}")

# データ構造を確認
if all_problems:
    print("\n最初の問題のデータ構造:")
    import pprint
    pprint.pprint(all_problems[0])
