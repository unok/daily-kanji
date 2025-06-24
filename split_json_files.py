#!/usr/bin/env python3
import json
import os
import glob

def estimate_tokens_conservative(text):
    """保守的なトークン数推定（1文字≈1.67トークン、つまり1トークン≈0.6文字）"""
    return int(len(text) * 1.67)

def split_questions_file(input_file, max_tokens=15000):
    """質問ファイルを指定トークン数で分割"""
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    base_name = os.path.basename(input_file).replace('.json', '')
    dir_name = os.path.dirname(input_file)
    
    # 現在のトークン数を確認
    current_tokens = estimate_tokens_conservative(json.dumps(data, ensure_ascii=False))
    
    # 分割が必要かチェック
    if current_tokens <= max_tokens:
        print(f"{base_name}: 分割不要 ({current_tokens:,} tokens)")
        return []
    
    print(f"\n{base_name}: 分割必要 ({current_tokens:,} tokens)")
    
    # メタデータのサイズを計算
    metadata = {
        "level": data["level"],
        "title": data["title"],
        "description": data["description"],
        "questions": []
    }
    metadata_tokens = estimate_tokens_conservative(json.dumps(metadata, ensure_ascii=False))
    
    # 質問を分割（より小さいチャンクサイズで）
    target_tokens = max_tokens * 0.8  # 80%程度を目標に
    splits = []
    current_split = []
    current_split_tokens = metadata_tokens
    
    for question in data["questions"]:
        question_json = json.dumps(question, ensure_ascii=False)
        question_tokens = estimate_tokens_conservative(question_json)
        
        # 単一の質問が大きすぎる場合の警告
        if question_tokens > target_tokens:
            print(f"  警告: 質問 {question['id']} が大きすぎます ({question_tokens:,} tokens)")
        
        if current_split_tokens + question_tokens > target_tokens and current_split:
            splits.append(current_split)
            current_split = []
            current_split_tokens = metadata_tokens
        
        current_split.append(question)
        current_split_tokens += question_tokens
    
    if current_split:
        splits.append(current_split)
    
    # バックアップを作成
    backup_file = f"{input_file}.backup"
    if not os.path.exists(backup_file):
        os.rename(input_file, backup_file)
        print(f"  バックアップ作成: {os.path.basename(backup_file)}")
    
    # 分割ファイルを作成
    output_files = []
    for i, split_questions in enumerate(splits, 1):
        output_data = {
            "level": data["level"],
            "title": f"{data['title']} (Part {i}/{len(splits)})",
            "description": data["description"],
            "questions": split_questions
        }
        
        output_file = os.path.join(dir_name, f"{base_name}-part{i}.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        # 作成したファイルのトークン数を確認
        created_tokens = estimate_tokens_conservative(open(output_file).read())
        output_files.append(output_file)
        print(f"  作成: {os.path.basename(output_file)} ({len(split_questions):,} questions, {created_tokens:,} tokens)")
    
    return output_files

def main():
    # 分割が必要なファイルのリスト
    files_to_split = [
        "src/data/questions/questions-elementary1.json",
        "src/data/questions/questions-elementary2.json",
        "src/data/questions/questions-elementary3.json",
        "src/data/questions/questions-elementary4.json",
        "src/data/questions/questions-elementary5.json",
        "src/data/questions/questions-elementary6.json",
        "src/data/questions/questions-junior.json",
        "src/data/questions/questions-senior.json"
    ]
    
    print("=== JSONファイル分割処理 ===")
    print(f"トークン推定方式: 1文字 ≈ 1.67トークン（保守的）")
    print(f"目標トークン数: 15,000トークン以下\n")
    
    all_created_files = []
    
    for file in files_to_split:
        if os.path.exists(file):
            created_files = split_questions_file(file)
            all_created_files.extend(created_files)
    
    print(f"\n=== 分割完了 ===")
    print(f"作成されたファイル数: {len(all_created_files)}")
    
    # 全JSONファイルの最終確認
    print("\n=== 最終確認 ===")
    json_files = sorted(glob.glob("src/data/questions/*.json"))
    over_limit = []
    
    for file in json_files:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            tokens = estimate_tokens_conservative(content)
            if tokens > 15000:
                over_limit.append((file, tokens))
    
    if over_limit:
        print(f"⚠️ まだ15,000トークンを超えているファイル:")
        for file, tokens in over_limit:
            print(f"  - {os.path.basename(file)}: {tokens:,} tokens")
    else:
        print("✅ 全てのファイルが15,000トークン以下になりました！")

if __name__ == "__main__":
    main()