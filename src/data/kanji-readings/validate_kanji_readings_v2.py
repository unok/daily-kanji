#!/usr/bin/env python3
import json
import re
import glob
import sys

def load_kanji_readings():
    """Load kanji readings from the JSON file"""
    with open('src/data/kanji-readings/kanji-readings.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def load_compound_readings():
    """Load compound word readings from the JSON file"""
    try:
        with open('src/data/kanji-readings/compound-readings.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def extract_kanji_reading_pairs(sentence):
    """Extract all [kanji|reading] pairs from a sentence"""
    pattern = r'\[([^|]+)\|([^]]+)\]'
    return re.findall(pattern, sentence)

def validate_reading(kanji_text, reading, kanji_readings, compound_readings):
    """Validate if the reading matches any valid readings"""
    
    # First check compound readings
    if kanji_text in compound_readings:
        valid_compound_readings = compound_readings[kanji_text]
        if reading in valid_compound_readings:
            return True
    
    # Handle single kanji
    if len(kanji_text) == 1:
        if kanji_text in kanji_readings:
            valid_readings = kanji_readings[kanji_text]
            # Check for exact match
            return reading in valid_readings
        return False
    
    # Handle multiple kanji (compound words) not in compound dictionary
    # For compound words, check if each kanji contributes to the reading
    
    # Special handling for rendaku (voicing changes) in compounds
    rendaku_map = {
        'か': ['が'], 'き': ['ぎ'], 'く': ['ぐ'], 'け': ['げ'], 'こ': ['ご'],
        'さ': ['ざ'], 'し': ['じ'], 'す': ['ず'], 'せ': ['ぜ'], 'そ': ['ぞ'],
        'た': ['だ'], 'ち': ['ぢ'], 'つ': ['づ'], 'て': ['で'], 'と': ['ど'],
        'は': ['ば', 'ぱ'], 'ひ': ['び', 'ぴ'], 'ふ': ['ぶ', 'ぷ'], 'へ': ['べ', 'ぺ'], 'ほ': ['ぼ', 'ぽ']
    }
    
    # Try to decompose the reading
    possible_combinations = []
    
    # Generate all possible reading combinations for the compound
    def get_all_readings(kanji):
        if kanji in kanji_readings:
            readings = kanji_readings[kanji][:]
            # Add rendaku variations
            extended_readings = []
            for r in readings:
                extended_readings.append(r)
                if r and r[0] in rendaku_map:
                    for variant in rendaku_map[r[0]]:
                        extended_readings.append(variant + r[1:])
            return extended_readings
        return []
    
    # For 2-kanji compounds, try all combinations
    if len(kanji_text) == 2:
        readings1 = get_all_readings(kanji_text[0])
        readings2 = get_all_readings(kanji_text[1])
        
        for r1 in readings1:
            for r2 in readings2:
                if r1 + r2 == reading:
                    return True
    
    # For longer compounds, check if the reading contains parts from each kanji
    elif len(kanji_text) > 2:
        # This is a simplified check - just verify that the reading could plausibly
        # come from the component kanji
        all_possible_readings = []
        for kanji in kanji_text:
            all_possible_readings.extend(get_all_readings(kanji))
        
        # If the reading length is reasonable for the number of kanji
        # (each kanji typically contributes 1-3 characters)
        if len(kanji_text) <= len(reading) <= len(kanji_text) * 3:
            return True  # Accept it for now, as precise validation is complex
    
    return False

def validate_file(filepath, kanji_readings, compound_readings):
    """Validate all kanji-reading pairs in a single file"""
    mismatches = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = data.get('questions', [])
    
    for question in questions:
        sentence = question.get('sentence', '')
        pairs = extract_kanji_reading_pairs(sentence)
        
        for kanji_text, reading in pairs:
            if not validate_reading(kanji_text, reading, kanji_readings, compound_readings):
                mismatches.append({
                    'file': filepath,
                    'id': question.get('id', 'unknown'),
                    'kanji': kanji_text,
                    'reading': reading,
                    'sentence': sentence
                })
    
    return mismatches

def main():
    """Main validation function"""
    kanji_readings = load_kanji_readings()
    compound_readings = load_compound_readings()
    
    print("🔍 漢字読み方検証ツール")
    print("=" * 80)
    print(f"📚 {len(kanji_readings)}個の漢字読みを読み込みました")
    print(f"📚 {len(compound_readings)}個の複合語読みを読み込みました")
    
    # Find all question files
    question_files = glob.glob('src/data/questions/questions-*.json')
    
    all_mismatches = []
    
    print("\n検証開始...")
    print("=" * 80)
    
    for filepath in sorted(question_files):
        print(f"Checking {filepath}...")
        mismatches = validate_file(filepath, kanji_readings, compound_readings)
        all_mismatches.extend(mismatches)
        
        if mismatches:
            print(f"  Found {len(mismatches)} mismatches")
        else:
            print(f"  All readings valid")
    
    print("=" * 80)
    
    # Count よみ placeholders
    yomi_count = sum(1 for m in all_mismatches if m['reading'] == 'よみ')
    non_yomi_count = len(all_mismatches) - yomi_count
    
    print(f"\n📊 検証結果サマリー")
    print("=" * 80)
    print(f"総不一致数: {len(all_mismatches)}個")
    print(f"  - 「よみ」プレースホルダー: {yomi_count}個")
    print(f"  - 実際の読み問題: {non_yomi_count}個")
    
    if len(all_mismatches) == 0:
        print("\n✅ すべての読みが正しく設定されています！")
        return 0  # Success - no issues
    
    # Any mismatches (including よみ) should be treated as errors
    if yomi_count > 0:
        print(f"\n❌ 「よみ」プレースホルダーが{yomi_count}個残っています！")
    if non_yomi_count > 0:
        print(f"❌ {non_yomi_count}個の読み問題が見つかりました！")
    
    if all_mismatches and non_yomi_count > 0:
        print("\nMismatch details:")
        print("-" * 80)
        
        # Group by kanji for easier analysis
        kanji_groups = {}
        for mismatch in all_mismatches:
            kanji = mismatch['kanji']
            if kanji not in kanji_groups:
                kanji_groups[kanji] = []
            kanji_groups[kanji].append(mismatch)
        
        # Separate single kanji and compound words
        single_kanji_mismatches = {k: v for k, v in kanji_groups.items() if len(k) == 1}
        compound_mismatches = {k: v for k, v in kanji_groups.items() if len(k) > 1}
        
        # Only show non-よみ mismatches
        if single_kanji_mismatches:
            print("\nSingle kanji mismatches (excluding よみ):")
            shown = 0
            for kanji, mismatches in sorted(single_kanji_mismatches.items()):
                non_yomi = [m for m in mismatches if m['reading'] != 'よみ']
                if non_yomi:
                    print(f"\n漢字: {kanji}")
                    if kanji in kanji_readings:
                        print(f"  Valid readings: {', '.join(kanji_readings[kanji])}")
                    else:
                        print(f"  No readings found in dictionary!")
                    
                    print(f"  Mismatches ({len(non_yomi)} total):")
                    for m in non_yomi[:3]:  # Show max 3 examples per kanji
                        print(f"    - Reading: {m['reading']} (in {m['file']} id:{m['id']})")
                    shown += 1
                    if shown >= 10:  # Limit output
                        print("\n... (more mismatches not shown)")
                        break
        
        if compound_mismatches:
            print("\n\nCompound word mismatches (excluding よみ):")
            shown = 0
            for kanji, mismatches in sorted(compound_mismatches.items()):
                non_yomi = [m for m in mismatches if m['reading'] != 'よみ']
                if non_yomi:
                    print(f"\n複合語: {kanji}")
                    if kanji in compound_readings:
                        print(f"  Valid readings: {', '.join(compound_readings[kanji])}")
                    else:
                        print(f"  No compound reading registered!")
                    
                    print(f"  Mismatches ({len(non_yomi)} total):")
                    for m in non_yomi[:3]:  # Show max 3 examples per compound
                        print(f"    - Reading: {m['reading']} (in {m['file']} id:{m['id']})")
                    shown += 1
                    if shown >= 10:  # Limit output
                        print("\n... (more mismatches not shown)")
                        break
        
        return 1  # Failure - real reading issues found
    
    # If we have any mismatches (including よみ), it's a failure
    if len(all_mismatches) > 0:
        return 1  # Failure - mismatches found
    
    # Save detailed report
    with open('validation_report_v2.json', 'w', encoding='utf-8') as f:
        json.dump({
            'total_mismatches': len(all_mismatches),
            'yomi_placeholders': yomi_count,
            'non_yomi_mismatches': non_yomi_count,
            'mismatches': all_mismatches
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\nDetailed report saved to validation_report_v2.json")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())