#!/usr/bin/env python3
import json
import re
import glob

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
    
    # Handle multiple kanji (compound words) - more sophisticated check
    # Try to match the reading by breaking it down
    
    # Method 1: Check if the compound reading is a combination of individual readings
    def check_compound_combination(text, target_reading, readings_dict):
        """Recursively check if target_reading can be formed from kanji readings"""
        if len(text) == 0:
            return len(target_reading) == 0
        
        first_kanji = text[0]
        if first_kanji not in readings_dict:
            return False
        
        for kanji_reading in readings_dict[first_kanji]:
            if target_reading.startswith(kanji_reading):
                # Try matching the rest
                if check_compound_combination(text[1:], target_reading[len(kanji_reading):], readings_dict):
                    return True
        
        return False
    
    # Method 2: Check for special readings with voicing changes (rendaku)
    def apply_rendaku(reading):
        """Apply common rendaku (voicing) transformations"""
        rendaku_map = {
            'か': 'が', 'き': 'ぎ', 'く': 'ぐ', 'け': 'げ', 'こ': 'ご',
            'さ': 'ざ', 'し': 'じ', 'す': 'ず', 'せ': 'ぜ', 'そ': 'ぞ',
            'た': 'だ', 'ち': 'ぢ', 'つ': 'づ', 'て': 'で', 'と': 'ど',
            'は': 'ば', 'ひ': 'び', 'ふ': 'ぶ', 'へ': 'べ', 'ほ': 'ぼ',
            'はん': 'ぱん', 'ひん': 'ぴん', 'ふん': 'ぷん', 'へん': 'ぺん', 'ほん': 'ぽん'
        }
        variations = [reading]
        
        # Add variations with first character voiced
        if reading and reading[0] in rendaku_map:
            variations.append(rendaku_map[reading[0]] + reading[1:])
        
        # Add variations for common suffixes
        for orig, voiced in rendaku_map.items():
            if reading.startswith(orig):
                variations.append(voiced + reading[len(orig):])
        
        return variations
    
    # Create an extended readings dictionary with rendaku variations
    extended_readings = {}
    for kanji, readings in kanji_readings.items():
        extended_readings[kanji] = []
        for r in readings:
            extended_readings[kanji].extend(apply_rendaku(r))
    
    # Try exact compound matching
    if check_compound_combination(kanji_text, reading, kanji_readings):
        return True
    
    # Try with rendaku variations
    if check_compound_combination(kanji_text, reading, extended_readings):
        return True
    
    # Method 3: Check if any component reading is contained in the target
    # (for cases where the reading might be abbreviated or special)
    for kanji in kanji_text:
        if kanji in kanji_readings:
            for kanji_reading in kanji_readings[kanji]:
                if kanji_reading in reading:
                    # Found at least one component - might be a special reading
                    # We'll flag this as potentially valid but needing review
                    return False  # For now, still mark as invalid
    
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
    
    print(f"Loaded {len(kanji_readings)} kanji readings")
    print(f"Loaded {len(compound_readings)} compound word readings")
    
    # Find all question files
    question_files = glob.glob('src/data/questions/questions-*.json')
    
    all_mismatches = []
    
    print("\nValidating kanji readings...")
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
    print(f"Total mismatches found: {len(all_mismatches)}")
    
    if all_mismatches:
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
        
        if single_kanji_mismatches:
            print("\nSingle kanji mismatches:")
            for kanji, mismatches in sorted(single_kanji_mismatches.items()):
                print(f"\n漢字: {kanji}")
                if kanji in kanji_readings:
                    print(f"  Valid readings: {', '.join(kanji_readings[kanji])}")
                else:
                    print(f"  No readings found in dictionary!")
                
                print(f"  Mismatches ({len(mismatches)} total):")
                for m in mismatches[:3]:  # Show max 3 examples per kanji
                    print(f"    - Reading: {m['reading']} (in {m['file']} id:{m['id']})")
        
        if compound_mismatches:
            print("\n\nCompound word mismatches:")
            for kanji, mismatches in sorted(compound_mismatches.items()):
                print(f"\n複合語: {kanji}")
                if kanji in compound_readings:
                    print(f"  Valid readings: {', '.join(compound_readings[kanji])}")
                else:
                    print(f"  No compound reading registered!")
                
                print(f"  Mismatches ({len(mismatches)} total):")
                for m in mismatches[:3]:  # Show max 3 examples per compound
                    print(f"    - Reading: {m['reading']} (in {m['file']} id:{m['id']})")
    
    # Save detailed report
    with open('validation_report_v2.json', 'w', encoding='utf-8') as f:
        json.dump({
            'total_mismatches': len(all_mismatches),
            'mismatches': all_mismatches,
            'summary': {kanji: len(items) for kanji, items in kanji_groups.items()},
            'single_kanji_count': len(single_kanji_mismatches) if all_mismatches else 0,
            'compound_word_count': len(compound_mismatches) if all_mismatches else 0
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\nDetailed report saved to validation_report_v2.json")
    
    # Suggest additions for commonly missing readings
    if all_mismatches:
        print("\n" + "=" * 80)
        print("SUGGESTED ADDITIONS:")
        print("=" * 80)
        
        # Collect unique missing readings
        missing_single = {}
        missing_compound = {}
        
        for mismatch in all_mismatches:
            kanji = mismatch['kanji']
            reading = mismatch['reading']
            
            if len(kanji) == 1:
                if kanji not in missing_single:
                    missing_single[kanji] = set()
                missing_single[kanji].add(reading)
            else:
                if kanji not in missing_compound:
                    missing_compound[kanji] = set()
                missing_compound[kanji].add(reading)
        
        if missing_single:
            print("\nAdd to kanji-readings.json:")
            for kanji, readings in sorted(missing_single.items())[:10]:  # Show top 10
                existing = kanji_readings.get(kanji, [])
                new_readings = sorted(readings - set(existing))
                if new_readings:
                    print(f'  "{kanji}": {json.dumps(existing + new_readings, ensure_ascii=False)},')
        
        if missing_compound:
            print("\nAdd to compound-readings.json:")
            for compound, readings in sorted(missing_compound.items())[:10]:  # Show top 10
                print(f'  "{compound}": {json.dumps(sorted(readings), ensure_ascii=False)},')

if __name__ == '__main__':
    main()