#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import os
import re
from collections import defaultdict, Counter
from pathlib import Path

def is_kanji(char):
    """漢字かどうかを判定する"""
    return 0x4e00 <= ord(char) <= 0x9fff

def extract_kanji_from_text(text):
    """テキストから漢字を抽出する（[漢字|読み]形式にも対応）"""
    import re
    
    # [漢字|読み]形式の漢字を抽出
    pattern = r'\[([^|]+)\|[^]]+\]'
    matches = re.findall(pattern, text)
    kanji_from_brackets = []
    for match in matches:
        kanji_from_brackets.extend([char for char in match if is_kanji(char)])
    
    # 通常の漢字も抽出
    regular_kanji = [char for char in text if is_kanji(char)]
    
    # 重複を除去して結合
    all_kanji = list(set(kanji_from_brackets + regular_kanji))
    return all_kanji

def analyze_kanji_frequency():
    """全ての問題ファイルから漢字の出現頻度を分析する"""
    
    base_dir = Path(__file__).parent / "src" / "data" / "questions"
    kanji_counter = Counter()
    file_kanji_map = defaultdict(list)  # どのファイルにどの漢字が含まれているか
    
    # 全ての JSONファイルを読み込み
    for json_file in base_dir.glob("*.json"):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            file_kanji = set()
            
            # 問題データから漢字を抽出
            if isinstance(data, list):
                questions = data
            else:
                questions = data.get('questions', [])
            
            for question in questions:
                # 問題文、選択肢、答えから漢字を抽出
                if 'question' in question:
                    kanji_list = extract_kanji_from_text(question['question'])
                    for kanji in kanji_list:
                        kanji_counter[kanji] += 1
                        file_kanji.add(kanji)
                
                if 'sentence' in question:
                    kanji_list = extract_kanji_from_text(question['sentence'])
                    for kanji in kanji_list:
                        kanji_counter[kanji] += 1
                        file_kanji.add(kanji)
                
                if 'choices' in question:
                    for choice in question['choices']:
                        kanji_list = extract_kanji_from_text(choice)
                        for kanji in kanji_list:
                            kanji_counter[kanji] += 1
                            file_kanji.add(kanji)
                
                if 'answer' in question:
                    kanji_list = extract_kanji_from_text(question['answer'])
                    for kanji in kanji_list:
                        kanji_counter[kanji] += 1
                        file_kanji.add(kanji)
                
                if 'reading' in question:
                    kanji_list = extract_kanji_from_text(question['reading'])
                    for kanji in kanji_list:
                        kanji_counter[kanji] += 1
                        file_kanji.add(kanji)
            
            file_kanji_map[json_file.name] = list(file_kanji)
            print(f"処理完了: {json_file.name} - {len(file_kanji)}個の異なる漢字")
            
        except Exception as e:
            print(f"エラー: {json_file.name} - {e}")
    
    return kanji_counter, file_kanji_map

def get_elementary_kanji_by_grade():
    """学年別の基本漢字リスト（一部）"""
    elementary_kanji = {
        1: "一二三四五六七八九十百千万円年月日本人大小中高上下左右入出先生学校水火土木金山川田男女子天空雨竹米車手足目耳口鼻花草虫犬猫鳥魚名前白青赤黄黒",
        2: "今何時分半朝昼夜明暗新古早遅春夏秋冬東西南北内外近遠多少長短太細高低強弱軽重大小明暗元気電話弟妹父母兄姉家族友達",
        3: "学習勉強教室図書館運動場体育館音楽美術理科社会国語算数英語宿題授業休憩昼食給食遊園地公園動物園水族館",
        4: "感情思考考察理解意見感想希望心配不安喜怒哀楽幸福悲哀満足感謝愛情友情信頼協力努力挑戦成功失敗",
        5: "科学実験観察研究発見発明技術工業農業商業歴史文化伝統芸術音楽絵画彫刻建築文学詩歌物語小説",
        6: "抽象具体論理思想哲学政治経済法律制度社会問題環境保護国際関係平和戦争自由平等権利義務責任"
    }
    return elementary_kanji

def main():
    print("漢字出現頻度分析を開始します...")
    
    kanji_counter, file_kanji_map = analyze_kanji_frequency()
    
    print(f"\n総漢字数: {len(kanji_counter)}")
    print(f"総出現回数: {sum(kanji_counter.values())}")
    
    # 1回のみ出現する漢字を抽出
    single_occurrence_kanji = [kanji for kanji, count in kanji_counter.items() if count == 1]
    print(f"\n1回のみ出現する漢字数: {len(single_occurrence_kanji)}")
    
    # 学年別基本漢字
    elementary_kanji = get_elementary_kanji_by_grade()
    
    # 1回のみ出現する小学校基本漢字を学年別に分類
    single_elementary_kanji = {}
    for grade, kanji_str in elementary_kanji.items():
        single_grade_kanji = []
        for kanji in kanji_str:
            if kanji in single_occurrence_kanji:
                single_grade_kanji.append(kanji)
        single_elementary_kanji[grade] = single_grade_kanji
    
    # 結果出力
    print("\n=== 1回のみ出現する小学校基本漢字（学年別） ===")
    for grade in range(1, 7):
        if single_elementary_kanji[grade]:
            print(f"\n小学{grade}年生レベル ({len(single_elementary_kanji[grade])}個):")
            print("".join(single_elementary_kanji[grade]))
            
            # どのファイルに含まれているかも表示
            for kanji in single_elementary_kanji[grade]:
                for filename, file_kanji_list in file_kanji_map.items():
                    if kanji in file_kanji_list:
                        print(f"  {kanji} → {filename}")
                        break
        else:
            print(f"\n小学{grade}年生レベル: なし")
    
    # 最も出現頻度の低い漢字（2-5回）も参考として表示
    print("\n=== 参考：出現頻度が少ない漢字（2-5回） ===")
    low_frequency_kanji = [kanji for kanji, count in kanji_counter.items() if 2 <= count <= 5]
    elementary_low_freq = {}
    
    for grade, kanji_str in elementary_kanji.items():
        low_freq_grade_kanji = []
        for kanji in kanji_str:
            if kanji in low_frequency_kanji:
                low_freq_grade_kanji.append((kanji, kanji_counter[kanji]))
        elementary_low_freq[grade] = low_freq_grade_kanji
    
    for grade in range(1, 7):
        if elementary_low_freq[grade]:
            print(f"\n小学{grade}年生レベル:")
            for kanji, count in elementary_low_freq[grade]:
                print(f"  {kanji}({count}回)")

if __name__ == "__main__":
    main()