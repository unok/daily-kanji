#!/usr/bin/env tsx

import { validateKanjiUsageInQuestions } from '../services/gradeKanjiValidation'

// 全ての要件を検証
function main() {
  console.log('🔍 日本語学習アプリの検証を開始します...\n')

  const result = validateKanjiUsageInQuestions()

  // エラーのサマリー
  let totalErrors = 0
  const errorSummary = []

  if (result.duplicateKanjiErrors.length > 0) {
    totalErrors += result.duplicateKanjiErrors.length
    errorSummary.push(`${result.duplicateKanjiErrors.length} 件の重複漢字エラー`)
  }

  if (result.duplicateSentences.length > 0) {
    totalErrors += result.duplicateSentences.length
    errorSummary.push(`${result.duplicateSentences.length} 件の重複文章`)
  }

  if (result.duplicateIds.length > 0) {
    totalErrors += result.duplicateIds.length
    errorSummary.push(`${result.duplicateIds.length} 件の重複ID`)
  }

  if (result.shortSentences.length > 0) {
    totalErrors += result.shortSentences.length
    errorSummary.push(`${result.shortSentences.length} 件の短い文章`)
  }

  // 低頻度漢字のカウント
  const lowFrequencyCount = Object.values(result.kanjiUsageStats).reduce((count, stats) => {
    return count + Object.values(stats).filter((usage) => usage < 5).length
  }, 0)

  if (lowFrequencyCount > 0) {
    totalErrors += lowFrequencyCount
    errorSummary.push(`${lowFrequencyCount} 個の低頻度漢字`)
  }

  // 結果の出力
  if (totalErrors === 0) {
    console.log('✅ すべての検証が成功しました！')
    process.exit(0)
  } else {
    console.error(`\n❌ ${totalErrors} 件のエラーが見つかりました:`)
    for (const error of errorSummary) {
      console.error(`   - ${error}`)
    }

    // 詳細なエラー情報を表示
    if (result.duplicateKanjiErrors.length > 0) {
      console.error('\n🔴 重複漢字エラー:')
      for (const error of result.duplicateKanjiErrors.slice(0, 5)) {
        console.error(`   ${error.questionId}: ${error.sentence}`)
        console.error(`   → "${error.kanjiChar}" が入力漢字と文章内で重複`)
      }
      if (result.duplicateKanjiErrors.length > 5) {
        console.error(`   ... 他 ${result.duplicateKanjiErrors.length - 5} 件`)
      }
    }

    if (result.duplicateSentences.length > 0) {
      console.error('\n🔴 重複文章:')
      for (const dup of result.duplicateSentences.slice(0, 5)) {
        console.error(`   "${dup.sentence}" が ${dup.ids.length} 回出現: ${dup.ids.join(', ')}`)
      }
      if (result.duplicateSentences.length > 5) {
        console.error(`   ... 他 ${result.duplicateSentences.length - 5} 件`)
      }
    }

    if (lowFrequencyCount > 0) {
      console.error('\n🔴 低頻度漢字（5回未満）:')
      let _displayCount = 0
      for (const [grade, stats] of Object.entries(result.kanjiUsageStats)) {
        const lowFreqKanji = Object.entries(stats)
          .filter(([_, usage]) => usage < 5)
          .sort((a, b) => a[1] - b[1])

        if (lowFreqKanji.length > 0) {
          console.error(`   ${grade}:`)
          for (const [kanji, usage] of lowFreqKanji.slice(0, 10)) {
            console.error(`     ${kanji}: ${usage}回`)
            _displayCount++
          }
          if (lowFreqKanji.length > 10) {
            console.error(`     ... 他 ${lowFreqKanji.length - 10} 個`)
          }
        }
      }
    }

    process.exit(1)
  }
}

main()
