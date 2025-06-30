#!/bin/bash
# 引数を安全に渡すためのラッパースクリプト

if [ $# -lt 2 ]; then
    echo "使用方法: ./fix-question.sh <ID> <新しい文章>"
    echo "例: ./fix-question.sh e5-159 \"[貧|ひん]しい生活を送りました。\""
    exit 1
fi

ID="$1"
shift
SENTENCE="$*"

# npxコマンドを実行
exec npx tsx src/scripts/fixQuestionByIdSafe.ts "$ID" "$SENTENCE"