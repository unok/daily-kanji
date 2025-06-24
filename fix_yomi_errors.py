#!/usr/bin/env python3
import json
import re

# 漢字ごとの適切な読み方と例文を定義
kanji_fixes = {
    "改": {
        "pattern1": "[改|あらた]めて考えました。",
        "pattern2": "[改|かい]善策を検討します。"
    },
    "海": {
        "pattern1": "[海|うみ]に泳ぎに行きました。",
        "pattern2": "[海|かい]外旅行をしました。"
    },
    "界": {
        "pattern1": "世[界|かい]中を旅しました。",
        "pattern2": "境[界|かい]線を引きました。"
    },
    "絵": {
        "pattern1": "[絵|え]を描きました。",
        "pattern2": "[絵|え]本を読みました。"
    },
    "開": {
        "pattern1": "ドアを[開|あ]けました。",
        "pattern2": "[開|かい]会式が始まりました。"
    },
    "街": {
        "pattern1": "[街|まち]を歩きました。",
        "pattern2": "商店[街|がい]で買い物しました。"
    },
    "各": {
        "pattern1": "[各|かく]自で準備してください。",
        "pattern2": "[各|おのおの]の意見を聞きました。"
    },
    "覚": {
        "pattern1": "[覚|おぼ]えておいてください。",
        "pattern2": "感[覚|かく]が鋭いです。"
    },
    "確": {
        "pattern1": "[確|たし]かめてみました。",
        "pattern2": "[確|かく]認してください。"
    },
    "額": {
        "pattern1": "[額|ひたい]に汗をかきました。",
        "pattern2": "金[額|がく]を計算しました。"
    },
    "刊": {
        "pattern1": "月[刊|かん]誌を読みました。",
        "pattern2": "新[刊|かん]が発売されました。"
    },
    "幹": {
        "pattern1": "木の[幹|みき]が太いです。",
        "pattern2": "[幹|かん]部会議に出席しました。"
    },
    "柔": {
        "pattern1": "[柔|やわ]らかい布団です。",
        "pattern2": "[柔|じゅう]道を習っています。"
    },
    "渋": {
        "pattern1": "[渋|しぶ]い味がします。",
        "pattern2": "[渋|じゅう]滞に巻き込まれました。"
    },
    "獣": {
        "pattern1": "野[獣|じゅう]が現れました。",
        "pattern2": "[獣|けもの]の足跡を見つけました。"
    },
    "縦": {
        "pattern1": "[縦|たて]に線を引きました。",
        "pattern2": "[縦|じゅう]横無尽に動きました。"
    },
    "重": {
        "pattern1": "[重|おも]い荷物を運びました。",
        "pattern2": "[重|じゅう]要な会議です。"
    },
    "銃": {
        "pattern1": "[銃|じゅう]を構えました。",
        "pattern2": "猟[銃|じゅう]の許可を取りました。"
    },
    "叔": {
        "pattern1": "[叔|しゅく]父に会いました。",
        "pattern2": "[叔|しゅく]母が来ました。"
    },
    "宿": {
        "pattern1": "[宿|やど]に泊まりました。",
        "pattern2": "[宿|しゅく]題を忘れました。"
    },
    "淑": {
        "pattern1": "[淑|しゅく]女になりなさい。",
        "pattern2": "貞[淑|しゅく]な人です。"
    },
    "祝": {
        "pattern1": "[祝|いわ]いの言葉を述べました。",
        "pattern2": "[祝|しゅく]日は休みです。"
    },
    "縮": {
        "pattern1": "[縮|ちぢ]んでしまいました。",
        "pattern2": "[縮|しゅく]小コピーを作りました。"
    },
    "粛": {
        "pattern1": "[粛|しゅく]清されました。",
        "pattern2": "厳[粛|しゅく]な雰囲気でした。"
    },
    "塾": {
        "pattern1": "[塾|じゅく]に通っています。",
        "pattern2": "学習[塾|じゅく]で勉強しました。"
    }
}

# ファイルを読み込む
with open('src/data/questions/questions-junior.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# エラーパターンを修正
fixed_count = 0
for i, item in enumerate(data):
    if 'sentence' in item:
        sentence = item['sentence']
        
        # [漢字|よみ]パターンを探す
        match = re.search(r'\[(.+?)\|よみ\]', sentence)
        if match:
            kanji = match.group(1)
            
            if kanji in kanji_fixes:
                if "について学びました" in sentence:
                    data[i]['sentence'] = kanji_fixes[kanji]['pattern1']
                    fixed_count += 1
                elif "を使って文を作ります" in sentence:
                    data[i]['sentence'] = kanji_fixes[kanji]['pattern2']
                    fixed_count += 1
            else:
                print(f"未定義の漢字: {kanji} - {sentence}")

print(f"修正した項目数: {fixed_count}")

# ファイルに書き戻す
with open('src/data/questions/questions-junior.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)