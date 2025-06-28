#!/usr/bin/env python3
import json
import re
from pathlib import Path
from collections import defaultdict

# 小学4年生の漢字リスト
GRADE4_KANJI = set(['不', '争', '井', '付', '令', '以', '仲', '伝', '位', '低', '佐', '例', '便', '信', '倉', '候', '借', '健', '側', '働', '億', '兆', '児', '共', '兵', '典', '冷', '初', '別', '利', '刷', '副', '功', '加', '努', '労', '勇', '包', '卒', '協', '単', '博', '印', '参', '司', '各', '周', '唱', '器', '固', '城', '埼', '塩', '変', '夫', '失', '奈', '好', '媛', '季', '孫', '完', '官', '害', '富', '察', '岐', '岡', '崎', '巣', '差', '希', '席', '帯', '底', '府', '康', '建', '径', '徒', '徳', '必', '念', '愛', '成', '戦', '折', '挙', '改', '敗', '散', '料', '旗', '昨', '景', '最', '望', '未', '末', '札', '材', '束', '松', '果', '栃', '栄', '案', '梅', '梨', '械', '極', '標', '機', '欠', '残', '氏', '民', '求', '沖', '治', '法', '泣', '浅', '浴', '清', '満', '滋', '漁', '潟', '灯', '無', '然', '焼', '照', '熊', '熱', '牧', '特', '産', '的', '省', '祝', '票', '種', '積', '競', '笑', '管', '節', '約', '結', '給', '続', '縄', '置', '群', '老', '臣', '良', '芸', '芽', '英', '茨', '菜', '街', '衣', '要', '覚', '観', '訓', '試', '説', '課', '議', '貨', '賀', '軍', '輪', '辞', '辺', '連', '達', '選', '郡', '量', '録', '鏡', '関', '阜', '阪', '陸', '隊', '静', '順', '願', '類', '飛', '飯', '養', '香', '験', '鹿'])

# 問題となっている漢字とその学年
PROBLEM_KANJI_INFO = {
    # 小学2年生の漢字
    '友': 2, '園': 2, '当': 2, '海': 2, '色': 2, '長': 2, '雲': 2,
    # 小学3年生の漢字
    '事': 3, '仕': 3, '化': 3, '州': 3, '役': 3, '所': 3, '練': 3, '苦': 3,
    # 小学5年生の漢字
    '仏': 5, '史': 5, '告': 5, '喜': 5, '囲': 5, '型': 5, '士': 5, '技': 5, '救': 5, '殺': 5, '紀': 5, '航': 5, '象': 5, '賞': 5,
    # 小学6年生の漢字
    '停': 6, '堂': 6, '得': 6, '歴': 6, '毒': 6, '粉': 6, '胃': 6, '脈': 6, '腸': 6, '貯': 6, '費': 6,
    # 中学以降
    '寿': 7
}

def extract_target_kanji(sentence):
    """文章から学習対象の漢字（[漢字|読み]形式）を抽出"""
    pattern = r'\[([^|]+)\|[^\]]+\]'
    matches = re.findall(pattern, sentence)
    kanji_list = []
    for match in matches:
        # 漢字だけを抽出
        kanji_chars = [char for char in match if '\u4e00' <= char <= '\u9fff']
        kanji_list.extend(kanji_chars)
    return kanji_list

def check_compound_word(sentence, target_kanji_matches):
    """熟語かどうかをチェックし、4年生の漢字を含むかどうかを確認"""
    # [航海|こうかい]のような形式から、実際の熟語を抽出
    pattern = r'\[([^|]+)\|[^\]]+\]'
    matches = re.findall(pattern, sentence)
    
    for match in matches:
        # この熟語に含まれる漢字
        kanji_in_word = [char for char in match if '\u4e00' <= char <= '\u9fff']
        
        # 熟語（2文字以上）かどうか
        if len(kanji_in_word) >= 2:
            # 4年生の漢字を含むか
            contains_grade4 = any(k in GRADE4_KANJI for k in kanji_in_word)
            # 問題のある漢字を含むか
            contains_problem = any(k in PROBLEM_KANJI_INFO for k in kanji_in_word)
            
            if contains_problem:
                return True, contains_grade4
    
    return False, False

def analyze_problems():
    """問題を分析し、修正が必要なものを抽出"""
    problems_dir = Path('src/data/questions')
    problems_to_fix = []
    
    # 小学4年生のファイルパターン
    pattern = 'questions-elementary4-part*.json'
    
    for file_path in sorted(problems_dir.glob(pattern)):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for question in data['questions']:
            target_kanji = extract_target_kanji(question['sentence'])
            
            # 問題のある漢字をチェック
            problematic_kanji = [k for k in target_kanji if k in PROBLEM_KANJI_INFO]
            
            if problematic_kanji:
                # 熟語チェック
                is_compound, contains_grade4 = check_compound_word(question['sentence'], target_kanji)
                
                # 修正が必要かどうか判定
                needs_fix = True
                fix_reason = ""
                
                if is_compound and contains_grade4:
                    # 熟語で4年生の漢字を含む場合は修正不要
                    needs_fix = False
                    fix_reason = "熟語で4年生の漢字を含む"
                elif len(target_kanji) == 1:
                    # 単独の他学年漢字
                    fix_reason = "単独の他学年漢字"
                else:
                    # 熟語だが4年生の漢字を含まない
                    fix_reason = "熟語だが4年生の漢字を含まない"
                
                problems_to_fix.append({
                    'file': file_path.name,
                    'id': question['id'],
                    'sentence': question['sentence'],
                    'target_kanji': target_kanji,
                    'problematic_kanji': problematic_kanji,
                    'kanji_grades': {k: PROBLEM_KANJI_INFO[k] for k in problematic_kanji},
                    'needs_fix': needs_fix,
                    'fix_reason': fix_reason
                })
    
    return problems_to_fix

def main():
    problems = analyze_problems()
    
    # 修正が必要な問題と不要な問題を分類
    needs_fix = [p for p in problems if p['needs_fix']]
    no_fix_needed = [p for p in problems if not p['needs_fix']]
    
    print(f"分析結果:")
    print(f"- 総問題数: {len(problems)}")
    print(f"- 修正が必要: {len(needs_fix)}")
    print(f"- 修正不要（熟語ルール）: {len(no_fix_needed)}")
    print()
    
    # 修正が必要な問題を詳細表示
    print("修正が必要な問題:")
    for i, problem in enumerate(needs_fix[:10], 1):  # 最初の10個を表示
        print(f"\n{i}. {problem['id']} ({problem['file']})")
        print(f"   文章: {problem['sentence']}")
        print(f"   問題の漢字: {', '.join(problem['problematic_kanji'])}")
        print(f"   理由: {problem['fix_reason']}")
    
    # 修正不要な問題も表示
    if no_fix_needed:
        print("\n\n修正不要な問題（熟語ルール）:")
        for i, problem in enumerate(no_fix_needed[:5], 1):  # 最初の5個を表示
            print(f"\n{i}. {problem['id']} ({problem['file']})")
            print(f"   文章: {problem['sentence']}")
            print(f"   対象漢字: {problem['target_kanji']}")
            print(f"   理由: {problem['fix_reason']}")
    
    # 結果をJSONファイルに保存
    output = {
        'summary': {
            'total_problems': len(problems),
            'needs_fix': len(needs_fix),
            'no_fix_needed': len(no_fix_needed)
        },
        'problems_to_fix': needs_fix,
        'no_fix_needed': no_fix_needed
    }
    
    with open('grade4_problems_analysis.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n詳細な分析結果を grade4_problems_analysis.json に保存しました。")

if __name__ == '__main__':
    main()