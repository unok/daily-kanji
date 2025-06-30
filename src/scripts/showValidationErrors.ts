#!/usr/bin/env tsx

import { validateKanjiUsageInQuestions } from '../services/gradeKanjiValidation'

function main() {
  const result = validateKanjiUsageInQuestions()

  // 重複文章エラーの詳細を表示
  if (result.duplicateSentences.length > 0) {
    console.log('📝 重複文章エラー:')
    console.log('=====================================')
    for (let i = 0; i < Math.min(result.duplicateSentences.length, 50); i++) {
      const dup = result.duplicateSentences[i]
      console.log(`\n${i + 1}. "${dup.sentence}"`)
      console.log(`   出現箇所:`)
      for (const id of dup.ids) {
        console.log(`   - ${id}`)
      }
    }
    if (result.duplicateSentences.length > 50) {
      console.log(`\n... 他 ${result.duplicateSentences.length - 50} 件`)
    }
  }

  // 重複漢字エラーの詳細を表示
  if (result.duplicateKanjiErrors.length > 0) {
    console.log('\n\n🔢 重複漢字エラー:')
    console.log('=====================================')
    for (let i = 0; i < Math.min(result.duplicateKanjiErrors.length, 20); i++) {
      const err = result.duplicateKanjiErrors[i]
      console.log(`\n${i + 1}. ${err.questionId || err.id}: "${err.sentence}"`)
      if (err.duplicates) {
        console.log(`   重複漢字: ${err.duplicates.join(', ')}`)
      } else if (err.duplicate) {
        console.log(`   重複漢字: ${err.duplicate}`)
      } else if (err.kanjiChar) {
        console.log(`   重複漢字: ${err.kanjiChar}`)
      }
    }
    if (result.duplicateKanjiErrors.length > 20) {
      console.log(`\n... 他 ${result.duplicateKanjiErrors.length - 20} 件`)
    }
  }
}

main()