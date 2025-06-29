#!/usr/bin/env python3
import json
import re

# kanji-readings.jsonから読みを取得
with open('/home/unok/git/daily-kanji/src/data/kanji-readings/kanji-readings.json', 'r', encoding='utf-8') as f:
    kanji_readings = json.load(f)

# 処理統計用
total_replacements = 0
file_count = 0

for i in range(25, 36):
    filename = f'/home/unok/git/daily-kanji/src/data/questions/questions-junior-part{i}.json'
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        local_replacements = 0
        
        # 置換実行
        matches = re.findall(r'\[(.+?)\|よみ\]', content)
        for kanji in matches:
            if kanji in kanji_readings and kanji_readings[kanji]:
                content = content.replace(f'[{kanji}|よみ]', f'[{kanji}|{kanji_readings[kanji][0]}]')
                local_replacements += 1
            else:
                print(f'Warning: Kanji "{kanji}" not found in kanji-readings.json')
        
        # ファイルに書き戻し
        if content != original_content:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Part {i}: {local_replacements} replacements')
            file_count += 1
            total_replacements += local_replacements
        else:
            print(f'Part {i}: No changes')
        
    except Exception as e:
        print(f'Part {i}: Error - {e}')

print(f'\nTotal: {total_replacements} replacements in {file_count} files')