#!/usr/bin/env python3
"""
不足している漢字の問題を追加するスクリプト
"""

import json
import os
from pathlib import Path

# 1回のみ出現の基本漢字（優先度高）
PRIORITY_1_KANJI = [
    "今", "日", "友", "達", "野", "球", "夏", "休", "算", "数", "計", "夕", "食", "音", "楽", "電", "車",
    "祖", "父", "母", "理", "科", "体", "育", "夜", "空", "誕", "生", "動", "物", "園", "病", "気", "心", "配",
    "世", "界", "社", "会", "歴", "史", "情", "報", "分", "析", "技", "術", "文", "化", "自", "然", "環", "境",
    "健", "康", "安", "全", "平", "和", "希", "望", "努", "力", "成", "功", "失", "敗", "経", "験", "知", "識"
]

# 2回出現の漢字（重要）
PRIORITY_2_KANJI = [
    "人", "間", "学", "校", "時", "代", "問", "題", "方", "法", "場", "所", "地", "域", "国", "家",
    "政", "治", "経", "済", "教", "育", "研", "究", "開", "発", "建", "設", "産", "業", "企", "業"
]

def create_kanji_questions(kanji, level="elementary4", start_id=10000):
    """指定された漢字の問題を作成"""
    questions = []
    
    # 各漢字に対して4-5問作成
    patterns = [
        f"[{kanji}|?]を使います。",
        f"[{kanji}|?]が大切です。", 
        f"[{kanji}|?]について学びます。",
        f"[{kanji}|?]を見ました。",
        f"[{kanji}|?]に行きます。"
    ]
    
    for i, pattern in enumerate(patterns):
        questions.append({
            "id": f"e4-{start_id + i}",
            "sentence": pattern.replace("?", get_reading(kanji))
        })
        
    return questions

def get_reading(kanji):
    """簡単な読み仮名マッピング"""
    readings = {
        "今": "いま", "日": "ひ", "友": "とも", "達": "だち", "野": "の", "球": "きゅう",
        "夏": "なつ", "休": "やす", "算": "さん", "数": "すう", "計": "けい", "夕": "ゆう",
        "食": "しょく", "音": "おん", "楽": "がく", "電": "でん", "車": "しゃ",
        "人": "ひと", "間": "かん", "学": "がく", "校": "こう", "時": "じ", "代": "だい"
    }
    return readings.get(kanji, "よ")

def add_questions_to_file(file_path, new_questions):
    """既存ファイルに新しい問題を追加"""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 最後のIDを取得
    last_id = max(int(q['id'].split('-')[1]) for q in data['questions'])
    
    # 新しい問題のIDを調整
    for i, question in enumerate(new_questions):
        question['id'] = f"e4-{last_id + i + 1}"
    
    data['questions'].extend(new_questions)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    """メイン処理"""
    base_dir = Path("/home/unok/git/daily-kanji/daily-kanji/src/data/questions")
    
    # 優先度1の漢字を処理
    all_questions = []
    current_id = 10000
    
    for kanji in PRIORITY_1_KANJI[:20]:  # 最初の20文字のみ
        questions = create_kanji_questions(kanji, start_id=current_id)
        all_questions.extend(questions)
        current_id += 5
    
    # 新しいファイルとして作成
    new_file_data = {
        "level": "elementary4",
        "title": "小学4年生 (追加問題)",
        "description": "不足している漢字の問題を追加",
        "questions": all_questions
    }
    
    output_file = base_dir / "questions-elementary4-additional.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(new_file_data, f, ensure_ascii=False, indent=2)
    
    print(f"追加問題ファイルを作成: {output_file}")
    print(f"問題数: {len(all_questions)}")

if __name__ == "__main__":
    main()