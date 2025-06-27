#!/usr/bin/env python3
"""残りの漢字使用回数を確認"""

import json
import glob
from collections import defaultdict

# 常用漢字のロード
with open('src/data/kanji-lists/jouyou-kanji.ts', 'r', encoding='utf-8') as f:
    content = f.read()
    # TypeScriptのexport文から漢字を抽出
    start = content.find('[')
    end = content.find(']', start) + 1
    kanji_str = content[start:end]
    # コメントを除去
    import re
    kanji_str = re.sub(r'//.*', '', kanji_str)
    kanji_array = eval(kanji_str)
    jouyou_kanji = set(kanji_array)

# 教育漢字のロード
with open('src/data/kanji-lists/education-kanji.ts', 'r', encoding='utf-8') as f:
    content = f.read()
    # 各学年の漢字を抽出
    education_kanji = set()
    for line in content.split('\n'):
        if '"' in line and not line.strip().startswith('//'):
            # "漢字" の形式から漢字を抽出
            parts = line.split('"')
            if len(parts) >= 2:
                kanji_str = parts[1]
                education_kanji.update(kanji_str)

# 高校で習う漢字 = 常用漢字 - 教育漢字
senior_kanji = jouyou_kanji - education_kanji

# 問題ファイルを読み込んで使用回数をカウント
kanji_usage_count = defaultdict(int)

# 高校の問題ファイルを読み込む
senior_files = glob.glob('src/data/questions/questions-senior-*.json')

for file_path in senior_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        questions = data.get('questions', [])
        
        for question in questions:
            sentence = question.get('sentence', '')
            # 文章から漢字を抽出してカウント
            for char in sentence:
                if char in senior_kanji:
                    kanji_usage_count[char] += 1

# 使用回数別に分類
usage_by_count = defaultdict(list)
for kanji, count in kanji_usage_count.items():
    usage_by_count[count].append(kanji)

# 未使用の漢字
unused_kanji = sorted(senior_kanji - set(kanji_usage_count.keys()))
if unused_kanji:
    usage_by_count[0] = unused_kanji

# 5回未満の漢字を表示
print("高校漢字の使用回数（5回未満のみ）:")
total_insufficient = 0
for count in range(5):
    if count in usage_by_count:
        kanji_list = sorted(usage_by_count[count])
        print(f"{count}回使用 ({len(kanji_list)}個): {','.join(kanji_list)}")
        total_insufficient += len(kanji_list)

print(f"\n5回未満の漢字の総数: {total_insufficient}個")
print(f"高校で習う漢字の総数: {len(senior_kanji)}個")

# 追加で必要な問題数を計算
needed_questions = 0
for count in range(5):
    if count in usage_by_count:
        needed_questions += len(usage_by_count[count]) * (5 - count)

print(f"\n必要な追加問題数: {needed_questions}個")