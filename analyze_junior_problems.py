#!/usr/bin/env python3

import json
import re
from collections import Counter, defaultdict
import os

# 教育漢字（小学校で習う漢字）のリストを取得
def load_education_kanji():
    with open('src/data/kanji-lists/education-kanji.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    all_elementary_kanji = set()
    for grade in ['1', '2', '3', '4', '5', '6']:
        all_elementary_kanji.update(data.get(grade, []))
    
    return all_elementary_kanji

# 中学校の問題ファイルを読み込み
def load_junior_questions():
    questions_dir = 'src/data/questions'
    all_questions = []
    
    for i in range(1, 20):  # junior-part1.json から junior-part19.json まで
        filename = f'questions-junior-part{i}.json'
        filepath = os.path.join(questions_dir, filename)
        
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for q in data['questions']:
                    q['file'] = filename
                    all_questions.extend(data['questions'])
    
    return all_questions

# 問題文から学習対象の漢字を抽出
def extract_target_kanji(sentence):
    # [漢字|読み] のパターンを抽出
    pattern = r'\[([^|]+)\|[^\]]+\]'
    matches = re.findall(pattern, sentence)
    
    target_kanji = []
    for match in matches:
        # 漢字のみを抽出
        kanji_only = re.findall(r'[\u4E00-\u9FAF]', match)
        target_kanji.extend(kanji_only)
    
    return target_kanji

def main():
    print("中学校の問題を分析中...")
    
    # データ読み込み
    elementary_kanji = load_education_kanji()
    questions = load_junior_questions()
    
    print(f"読み込んだ問題数: {len(questions)}")
    
    # 問題分析
    elementary_target_count = 0
    kanji_counter = Counter()
    grade_distribution = defaultdict(int)
    problem_patterns = defaultdict(list)
    
    # 小学校の漢字を学年別に分類
    with open('src/data/kanji-lists/education-kanji.json', 'r', encoding='utf-8') as f:
        education_data = json.load(f)
    
    kanji_to_grade = {}
    for grade in ['1', '2', '3', '4', '5', '6']:
        for kanji in education_data.get(grade, []):
            kanji_to_grade[kanji] = int(grade)
    
    # 各問題を分析
    for q in questions:
        target_kanji = extract_target_kanji(q['sentence'])
        
        # 学習対象の漢字が小学校で習う漢字かチェック
        elementary_kanji_found = [k for k in target_kanji if k in elementary_kanji]
        
        if elementary_kanji_found:
            elementary_target_count += 1
            
            # 漢字をカウント
            for kanji in elementary_kanji_found:
                kanji_counter[kanji] += 1
                
                # 学年別に分類
                grade = kanji_to_grade.get(kanji, 0)
                if grade > 0:
                    grade_distribution[grade] += 1
            
            # 問題パターンを記録（最初の10件まで）
            if len(problem_patterns[tuple(elementary_kanji_found)]) < 10:
                problem_patterns[tuple(elementary_kanji_found)].append({
                    'id': q['id'],
                    'file': q['file'],
                    'sentence': q['sentence']
                })
    
    # 結果出力
    print(f"\n=== 分析結果 ===")
    print(f"小学校の漢字を学習対象にしている問題数: {elementary_target_count}/{len(questions)} ({elementary_target_count/len(questions)*100:.1f}%)")
    
    print(f"\n=== 学年別分布 ===")
    for grade in sorted(grade_distribution.keys()):
        print(f"小学{grade}年生の漢字: {grade_distribution[grade]}件")
    
    print(f"\n=== 最頻出の小学校漢字TOP20 ===")
    for kanji, count in kanji_counter.most_common(20):
        grade = kanji_to_grade.get(kanji, '?')
        print(f"{kanji} (小{grade}年): {count}回")
    
    print(f"\n=== 頻出パターンの例 ===")
    # パターンを出現回数でソート
    pattern_counts = [(pattern, len(examples)) for pattern, examples in problem_patterns.items()]
    pattern_counts.sort(key=lambda x: x[1], reverse=True)
    
    for i, (pattern, count) in enumerate(pattern_counts[:5]):
        print(f"\nパターン{i+1}: {', '.join(pattern)} ({count}件)")
        examples = problem_patterns[pattern]
        for j, example in enumerate(examples[:3]):
            print(f"  例{j+1}: {example['sentence']} ({example['file']} - {example['id']})")

if __name__ == "__main__":
    main()