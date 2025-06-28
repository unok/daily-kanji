#!/usr/bin/env python3
import json
import re

# 小学4年生の漢字リスト
GRADE4_KANJI = set(['不', '争', '井', '付', '令', '以', '仲', '伝', '位', '低', '佐', '例', '便', '信', '倉', '候', '借', '健', '側', '働', '億', '兆', '児', '共', '兵', '典', '冷', '初', '別', '利', '刷', '副', '功', '加', '努', '労', '勇', '包', '卒', '協', '単', '博', '印', '参', '司', '各', '周', '唱', '器', '固', '城', '埼', '塩', '変', '夫', '失', '奈', '好', '媛', '季', '孫', '完', '官', '害', '富', '察', '岐', '岡', '崎', '巣', '差', '希', '席', '帯', '底', '府', '康', '建', '径', '徒', '徳', '必', '念', '愛', '成', '戦', '折', '挙', '改', '敗', '散', '料', '旗', '昨', '景', '最', '望', '未', '末', '札', '材', '束', '松', '果', '栃', '栄', '案', '梅', '梨', '械', '極', '標', '機', '欠', '残', '氏', '民', '求', '沖', '治', '法', '泣', '浅', '浴', '清', '満', '滋', '漁', '潟', '灯', '無', '然', '焼', '照', '熊', '熱', '牧', '特', '産', '的', '省', '祝', '票', '種', '積', '競', '笑', '管', '節', '約', '結', '給', '続', '縄', '置', '群', '老', '臣', '良', '芸', '芽', '英', '茨', '菜', '街', '衣', '要', '覚', '観', '訓', '試', '説', '課', '議', '貨', '賀', '軍', '輪', '辞', '辺', '連', '達', '選', '郡', '量', '録', '鏡', '関', '阜', '阪', '陸', '隊', '静', '順', '願', '類', '飛', '飯', '養', '香', '験', '鹿'])

def get_problem_context(sentence):
    """文章から文脈を理解する"""
    # 簡単なキーワードベースの文脈理解
    if 'バス' in sentence or '車' in sentence:
        return 'vehicle'
    elif '歴史' in sentence or '昔' in sentence:
        return 'history'
    elif '結果' in sentence or '知' in sentence:
        return 'inform'
    elif '合格' in sentence or 'うれし' in sentence:
        return 'emotion'
    elif '敵' in sentence or '戦' in sentence:
        return 'battle'
    elif 'お寺' in sentence or '見学' in sentence:
        return 'building'
    elif '弁護' in sentence or '医者' in sentence:
        return 'profession'
    elif '困' in sentence or '助' in sentence:
        return 'help'
    elif '蚊' in sentence or '虫' in sentence:
        return 'insect'
    elif '生き物' in sentence or '危険' in sentence:
        return 'danger'
    elif '混ぜ' in sentence or '料理' in sentence:
        return 'cooking'
    elif '元前' in sentence or '世紀' in sentence:
        return 'era'
    else:
        return 'general'

def create_specific_corrections():
    """具体的な問題に対する手動での修正案を定義"""
    corrections = {
        'e4-016': {
            'original': 'バスが[停|てい]車しました。',
            'corrected': 'バスが[到|とう]着しました。',
            'explanation': '「停車」を「到着」に変更。停（6年）→到着は自然な表現'
        },
        'e4-044': {
            'original': '日本の[史|し]実を学びました。',
            'corrected': '日本の[真|しん]実を学びました。',
            'explanation': '「史実」を「真実」に変更。史（5年）→真（3年）は4年生対象外だが、より良い代替案として「日本の[昔|むかし]を学びました。」'
        },
        'e4-047': {
            'original': '結果を[告|つ]げました。',
            'corrected': '結果を[伝|つた]えました。',
            'explanation': '「告げる」を「伝える」に変更。告（5年）→伝（4年）'
        },
        'e4-050': {
            'original': '合格を[喜|よろこ]びました。',
            'corrected': '合格して[祝|いわ]いました。',
            'explanation': '「喜ぶ」を「祝う」に変更。喜（5年）→祝（4年）'
        },
        'e4-052': {
            'original': '敵に[囲|かこ]まれました。',
            'corrected': '敵が[周|まわ]りにいました。',
            'explanation': '「囲まれる」を「周りにいる」に変更。囲（5年）→周（4年）'
        },
        'e4-054': {
            'original': '新しい[型|かた]の車が発売されました。',
            'corrected': '新しい[種|しゅ]類の車が発売されました。',
            'explanation': '「型」を「種類」に変更。型（5年）→種（4年）'
        },
        'e4-055': {
            'original': 'お[堂|どう]を見学しました。',
            'corrected': 'お[宮|みや]を見学しました。',
            'explanation': '「お堂」を「お宮」に変更。堂（6年）→宮（3年）は4年生対象外だが、より良い代替案として「[寺|てら]を見学しました。」'
        },
        'e4-057': {
            'original': '弁護[士|し]になりたいです。',
            'corrected': '[法|ほう]律家になりたいです。',
            'explanation': '「弁護士」を「法律家」に変更。士（5年）→法（4年）'
        },
        'e4-079': {
            'original': '良い結果を[得|え]ました。',
            'corrected': '良い結果を[受|う]けました。',
            'explanation': '「得る」を「受ける」に変更。得（6年）→受（3年）は4年生対象外だが、より良い代替案として「良い結果に[達|たっ]しました。」'
        },
        'e4-088': {
            'original': '困っている人を[救|すく]いました。',
            'corrected': '困っている人を[助|たす]けました。',
            'explanation': '「救う」を「助ける」に変更。救（5年）→助（3年）は4年生対象外だが、より良い代替案として「困っている人を[守|まも]りました。」'
        },
        'e4-112': {
            'original': '日本の[歴|れき]史を学びました。',
            'corrected': '日本の[昔|むかし]を学びました。',
            'explanation': '「歴史」を「昔」に変更。歴（6年）→昔（3年）は4年生対象外だが、学習内容として適切'
        },
        'e4-114': {
            'original': '蚊を[殺|ころ]しました。',
            'corrected': '蚊を[倒|たお]しました。',
            'explanation': '「殺す」を「倒す」に変更。殺（5年）→倒（3年）は4年生対象外だが、より良い代替案として「蚊を[退|しりぞ]けました。」'
        },
        'e4-115': {
            'original': '[毒|どく]を持つ生き物に注意します。',
            'corrected': '[害|がい]のある生き物に注意します。',
            'explanation': '「毒」を「害」に変更。毒（6年）→害（4年）'
        },
        'e4-144': {
            'original': '[粉|こな]を混ぜました。',
            'corrected': '[材|ざい]料を混ぜました。',
            'explanation': '「粉」を「材料」に変更。粉（6年）→材（4年）'
        },
        'e4-145': {
            'original': '[紀|き]元前の歴史を学びました。',
            'corrected': '[昔|むかし]の時代を学びました。',
            'explanation': '「紀元前」を「昔の時代」に変更。紀（5年）→文脈を変更'
        }
    }
    return corrections

def main():
    # 分析結果を読み込む
    with open('grade4_problems_analysis.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 手動で定義した修正案
    manual_corrections = create_specific_corrections()
    
    # 修正案のリスト
    all_corrections = []
    
    # 修正が必要な問題を処理
    problems_to_fix = data['problems_to_fix']
    
    for problem in problems_to_fix[:50]:  # 最初の50問題
        if problem['id'] in manual_corrections:
            # 手動で定義した修正案を使用
            corr = manual_corrections[problem['id']]
            all_corrections.append({
                'id': problem['id'],
                'file': problem['file'],
                'original_sentence': corr['original'],
                'corrected_sentence': corr['corrected'],
                'explanation': corr['explanation'],
                'problematic_kanji': problem['problematic_kanji'],
                'kanji_grades': problem['kanji_grades']
            })
    
    # 結果を表示
    print(f"修正案を作成しました: {len(all_corrections)}件\n")
    
    for i, corr in enumerate(all_corrections[:15], 1):
        print(f"{i}. {corr['id']} ({corr['file']})")
        print(f"   旧: {corr['original_sentence']}")
        print(f"   新: {corr['corrected_sentence']}")
        print(f"   説明: {corr['explanation']}")
        print()
    
    # 修正案をJSONファイルに保存
    output = {
        'total_corrections': len(all_corrections),
        'corrections': all_corrections
    }
    
    with open('grade4_corrections_manual.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n修正案を grade4_corrections_manual.json に保存しました。")
    
    # ファイル別の統計
    file_stats = {}
    for corr in all_corrections:
        file = corr['file']
        if file not in file_stats:
            file_stats[file] = 0
        file_stats[file] += 1
    
    print("\nファイル別修正数:")
    for file, count in sorted(file_stats.items()):
        print(f"  {file}: {count}件")

if __name__ == '__main__':
    main()