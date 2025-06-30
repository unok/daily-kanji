#!/bin/bash

# Fix remaining validation errors efficiently

# Extract specific error patterns and fix them one by one
echo "Fixing remaining validation errors systematically..."

# Run validation to get current status
npx tsx src/scripts/validateComprehensive.ts > current_errors.txt 2>&1

# Extract error count
ERROR_COUNT=$(head -n 5 current_errors.txt | grep "エラーが見つかりました" | grep -o '[0-9]\+')
echo "Current error count: $ERROR_COUNT"

# Process specific error patterns for common grade-inappropriate kanji
echo "Fixing grade-inappropriate kanji errors..."

# Continue fixing errors one by one
echo "Manual fixes required - check validation results"