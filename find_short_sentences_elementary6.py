#!/usr/bin/env python3
import json
import glob

def find_short_sentences(file_path):
    """Find sentences with less than 9 characters in a question file."""
    short_sentences = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    questions = data.get('questions', [])
    
    for item in questions:
        sentence = item.get('sentence', '')
        # Remove kanji readings and placeholders to get the actual sentence length
        clean_sentence = sentence
        # Remove [kanji|reading] patterns
        import re
        clean_sentence = re.sub(r'\[([^|]+)\|[^\]]+\]', r'\1', clean_sentence)
        # Remove placeholders
        clean_sentence = clean_sentence.replace('＜＞', '')
        
        if len(clean_sentence) < 9:
            # Extract target kanji from the sentence
            target_kanji_match = re.search(r'\[([^|]+)\|[^\]]+\]', sentence)
            target_kanji = target_kanji_match.group(1) if target_kanji_match else 'unknown'
            
            short_sentences.append({
                'file': file_path.split('/')[-1],
                'id': item.get('id', 'unknown'),
                'sentence': sentence,
                'clean_sentence': clean_sentence,
                'length': len(clean_sentence),
                'targetKanji': target_kanji
            })
    
    return short_sentences

# Find all elementary6 question files
pattern = 'src/data/questions/questions-elementary6-*.json'
files = sorted(glob.glob(pattern))

all_short_sentences = []

for file_path in files:
    short_sentences = find_short_sentences(file_path)
    all_short_sentences.extend(short_sentences)

# Sort by file and id
all_short_sentences.sort(key=lambda x: (x['file'], x['id']))

# Files that are already modified (from git status)
modified_files = {
    'questions-elementary1-part2.json',
    'questions-elementary1-part3.json',
    'questions-elementary1-part4.json',
    'questions-elementary1-part5.json',
    'questions-elementary1-part6.json',
    'questions-elementary1-part7.json',
    'questions-elementary2-part1.json',
    'questions-elementary2-part10.json',
    'questions-elementary2-part3.json',
    'questions-elementary2-part8.json',
    'questions-elementary2-part9.json',
    'questions-elementary3-part1.json',
    'questions-elementary3-part10.json',
    'questions-elementary3-part2.json',
    'questions-elementary3-part3.json',
    'questions-elementary3-part4.json',
    'questions-elementary3-part8.json',
    'questions-elementary4-part11.json',
    'questions-elementary5-part1.json',
    'questions-elementary5-part6.json',
    'questions-junior-part1.json',
    'questions-junior-part19.json',
    'questions-senior-part10.json',
    'questions-senior-part13.json',
    'questions-senior-part4.json'
}

# Filter out sentences from unmodified files only
unmodified_short_sentences = [s for s in all_short_sentences if s['file'] not in modified_files]

print(f"Found {len(all_short_sentences)} total short sentences (< 9 characters) in elementary6 files")
print(f"Found {len(unmodified_short_sentences)} short sentences in unmodified elementary6 files:\n")

for i, item in enumerate(unmodified_short_sentences, 1):
    print(f"{i}. File: {item['file']}")
    print(f"   ID: {item['id']}")
    print(f"   Sentence: {item['sentence']}")
    print(f"   Clean: {item['clean_sentence']}")
    print(f"   Length: {item['length']} characters")
    print(f"   Target Kanji: {item['targetKanji']}")
    print()