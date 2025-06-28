#!/usr/bin/env python3
import json
import glob
import re

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

# Sort by length (shortest first), then by ID
all_short_sentences.sort(key=lambda x: (x['length'], x['id']))

# Get the 11 shortest sentences
shortest_11 = all_short_sentences[:11]

print(f"The 11 shortest sentences in elementary6 files that need to be fixed:\n")

for i, item in enumerate(shortest_11, 1):
    print(f"{i}. File: {item['file']}")
    print(f"   ID: {item['id']}")
    print(f"   Sentence: {item['sentence']}")
    print(f"   Clean: {item['clean_sentence']}")
    print(f"   Length: {item['length']} characters")
    print(f"   Target Kanji: {item['targetKanji']}")
    print()

# Also show if there are more very short ones
very_short = [s for s in all_short_sentences if s['length'] <= 4]
print(f"\nTotal sentences with 4 or fewer characters: {len(very_short)}")