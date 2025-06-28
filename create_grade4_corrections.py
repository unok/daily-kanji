#!/usr/bin/env python3
import json
import re
from collections import defaultdict

# 小学4年生の漢字リスト
GRADE4_KANJI = set(['不', '争', '井', '付', '令', '以', '仲', '伝', '位', '低', '佐', '例', '便', '信', '倉', '候', '借', '健', '側', '働', '億', '兆', '児', '共', '兵', '典', '冷', '初', '別', '利', '刷', '副', '功', '加', '努', '労', '勇', '包', '卒', '協', '単', '博', '印', '参', '司', '各', '周', '唱', '器', '固', '城', '埼', '塩', '変', '夫', '失', '奈', '好', '媛', '季', '孫', '完', '官', '害', '富', '察', '岐', '岡', '崎', '巣', '差', '希', '席', '帯', '底', '府', '康', '建', '径', '徒', '徳', '必', '念', '愛', '成', '戦', '折', '挙', '改', '敗', '散', '料', '旗', '昨', '景', '最', '望', '未', '末', '札', '材', '束', '松', '果', '栃', '栄', '案', '梅', '梨', '械', '極', '標', '機', '欠', '残', '氏', '民', '求', '沖', '治', '法', '泣', '浅', '浴', '清', '満', '滋', '漁', '潟', '灯', '無', '然', '焼', '照', '熊', '熱', '牧', '特', '産', '的', '省', '祝', '票', '種', '積', '競', '笑', '管', '節', '約', '結', '給', '続', '縄', '置', '群', '老', '臣', '良', '芸', '芽', '英', '茨', '菜', '街', '衣', '要', '覚', '観', '訓', '試', '説', '課', '議', '貨', '賀', '軍', '輪', '辞', '辺', '連', '達', '選', '郡', '量', '録', '鏡', '関', '阜', '阪', '陸', '隊', '静', '順', '願', '類', '飛', '飯', '養', '香', '験', '鹿'])

# 修正候補の定義
CORRECTION_PATTERNS = {
    # 6年生の漢字
    '停': {'replacements': ['止', '泊', '留'], 'context': 'stop'},
    '堂': {'replacements': ['場', '館', '殿'], 'context': 'building'},
    '得': {'replacements': ['取', '受', '持'], 'context': 'get'},
    '歴': {'replacements': ['昔', '過', '前'], 'context': 'history'},
    '毒': {'replacements': ['害', '悪', '危'], 'context': 'poison'},
    '粉': {'replacements': ['末', '細', '小'], 'context': 'powder'},
    '胃': {'replacements': ['腹', '体', '中'], 'context': 'stomach'},
    '脈': {'replacements': ['筋', '管', '血'], 'context': 'pulse'},
    '腸': {'replacements': ['腹', '体', '内'], 'context': 'intestine'},
    '貯': {'replacements': ['蓄', '積', '残'], 'context': 'save'},
    '費': {'replacements': ['料', '代', '金'], 'context': 'expense'},
    
    # 5年生の漢字
    '仏': {'replacements': ['神', '寺', '像'], 'context': 'buddha'},
    '史': {'replacements': ['昔', '録', '話'], 'context': 'history'},
    '告': {'replacements': ['言', '知', '伝'], 'context': 'tell'},
    '喜': {'replacements': ['楽', '幸', '笑'], 'context': 'joy'},
    '囲': {'replacements': ['周', '回', '巻'], 'context': 'surround'},
    '型': {'replacements': ['式', '形', '種'], 'context': 'type'},
    '士': {'replacements': ['者', '人', '家'], 'context': 'person'},
    '技': {'replacements': ['術', '法', '芸'], 'context': 'skill'},
    '救': {'replacements': ['助', '守', '治'], 'context': 'save'},
    '殺': {'replacements': ['害', '倒', '消'], 'context': 'kill'},
    '紀': {'replacements': ['代', '録', '年'], 'context': 'era'},
    '航': {'replacements': ['船', '飛', '旅'], 'context': 'navigate'},
    '象': {'replacements': ['形', '姿', '様'], 'context': 'figure'},
    '賞': {'replacements': ['償', '価', '料'], 'context': 'prize'},
    
    # 3年生の漢字
    '事': {'replacements': ['物', '件', '用'], 'context': 'thing'},
    '仕': {'replacements': ['働', '務', '用'], 'context': 'serve'},
    '化': {'replacements': ['変', '成', '転'], 'context': 'change'},
    '州': {'replacements': ['県', '地', '国'], 'context': 'state'},
    '役': {'replacements': ['務', '働', '仕'], 'context': 'role'},
    '所': {'replacements': ['場', '地', '処'], 'context': 'place'},
    '練': {'replacements': ['習', '学', '鍛'], 'context': 'practice'},
    '苦': {'replacements': ['辛', '痛', '難'], 'context': 'suffer'},
    
    # 2年生の漢字
    '友': {'replacements': ['仲', '親', '相'], 'context': 'friend'},
    '園': {'replacements': ['場', '地', '所'], 'context': 'garden'},
    '当': {'replacements': ['正', '的', '合'], 'context': 'hit'},
    '海': {'replacements': ['湖', '池', '水'], 'context': 'sea'},
    '色': {'replacements': ['彩', '様', '光'], 'context': 'color'},
    '長': {'replacements': ['大', '高', '遠'], 'context': 'long'},
    '雲': {'replacements': ['空', '天', '気'], 'context': 'cloud'},
    
    # 中学以降
    '寿': {'replacements': ['祝', '賀', '幸'], 'context': 'longevity'}
}

def create_correction(problem):
    """問題に対する修正案を作成"""
    sentence = problem['sentence']
    correction = None
    
    # 問題の漢字を1つずつ処理
    for kanji in problem['problematic_kanji']:
        if kanji in CORRECTION_PATTERNS:
            pattern = CORRECTION_PATTERNS[kanji]
            
            # 文脈に応じて適切な置換候補を選択
            for replacement in pattern['replacements']:
                if replacement in GRADE4_KANJI:
                    # パターンマッチで置換
                    # [漢字|読み]形式を見つけて置換
                    old_pattern = rf'\[{re.escape(kanji)}(\|[^\]]+)?\]'
                    
                    # 読みを保持するか新しい読みを設定
                    match = re.search(old_pattern, sentence)
                    if match:
                        if match.group(1):  # 読みがある場合
                            # 既存の読みを使用（簡略化のため）
                            new_text = f'[{replacement}{match.group(1)}]'
                        else:
                            # 読みを追加
                            new_text = f'[{replacement}|{get_reading(replacement)}]'
                        
                        new_sentence = re.sub(old_pattern, new_text, sentence)
                        
                        correction = {
                            'original_sentence': sentence,
                            'corrected_sentence': new_sentence,
                            'replaced': {kanji: replacement},
                            'reason': f'{kanji}（{problem["kanji_grades"][kanji]}年生）を{replacement}（4年生）に置換'
                        }
                        break
            
            if correction:
                break
    
    return correction

def get_reading(kanji):
    """漢字の読みを取得（簡略化）"""
    # 実際にはより複雑な読み方の処理が必要
    readings = {
        '止': 'と',
        '泊': 'と',
        '留': 'と',
        '場': 'じょう',
        '館': 'かん',
        '殿': 'でん',
        '取': 'と',
        '受': 'う',
        '持': 'も',
        '昔': 'むかし',
        '過': 'か',
        '前': 'まえ',
        '害': 'がい',
        '悪': 'あく',
        '危': 'き',
        '末': 'まつ',
        '細': 'さい',
        '小': 'しょう',
        '腹': 'ふく',
        '体': 'たい',
        '中': 'ちゅう',
        '筋': 'きん',
        '管': 'かん',
        '血': 'けつ',
        '内': 'ない',
        '蓄': 'ちく',
        '積': 'せき',
        '残': 'ざん',
        '料': 'りょう',
        '代': 'だい',
        '金': 'きん'
    }
    return readings.get(kanji, kanji)

def main():
    # 分析結果を読み込む
    with open('grade4_problems_analysis.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    problems_to_fix = data['problems_to_fix']
    corrections = []
    
    # 各問題に対して修正案を作成
    for problem in problems_to_fix[:30]:  # 最初の30問題を処理
        correction = create_correction(problem)
        if correction:
            corrections.append({
                'id': problem['id'],
                'file': problem['file'],
                **correction
            })
    
    # 結果を表示
    print(f"修正案を作成しました: {len(corrections)}件\n")
    
    for i, corr in enumerate(corrections[:10], 1):
        print(f"{i}. {corr['id']} ({corr['file']})")
        print(f"   旧: {corr['original_sentence']}")
        print(f"   新: {corr['corrected_sentence']}")
        print(f"   理由: {corr['reason']}")
        print()
    
    # 修正案をJSONファイルに保存
    output = {
        'total_corrections': len(corrections),
        'corrections': corrections
    }
    
    with open('grade4_corrections.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"修正案を grade4_corrections.json に保存しました。")

if __name__ == '__main__':
    main()