#!/usr/bin/env tsx

import { validateKanjiUsageInQuestions } from '../services/gradeKanjiValidation'

// 包括的な学年別漢字検証
function main() {
  console.log('📚 包括的な学年別漢字検証を開始します...\n')

  const result = validateKanjiUsageInQuestions()

  // 各学年の統計情報を表示
  console.log('📊 学年別漢字使用統計:')
  console.log('=====================================')

  for (const [grade, stats] of Object.entries(result.kanjiUsageStats)) {
    const kanjiList = Object.entries(stats)
    const totalKanji = kanjiList.length
    const wellUsedKanji = kanjiList.filter(([_, usage]) => usage >= 5).length
    const lowUsageKanji = kanjiList.filter(([_, usage]) => usage < 5)
    const totalUsage = kanjiList.reduce((sum, [_, usage]) => sum + usage, 0)
    const avgUsage = totalKanji > 0 ? (totalUsage / totalKanji).toFixed(1) : '0'

    console.log(`\n${grade}:`)
    console.log(`  総漢字数: ${totalKanji}`)
    console.log(`  5回以上使用: ${wellUsedKanji} (${totalKanji > 0 ? ((wellUsedKanji / totalKanji) * 100).toFixed(1) : 0}%)`)
    console.log(`  5回未満使用: ${lowUsageKanji.length}`)
    console.log(`  平均使用回数: ${avgUsage}`)

    if (lowUsageKanji.length > 0) {
      console.log('  低頻度漢字:')
      const sortedLowUsage = lowUsageKanji.sort((a, b) => a[1] - b[1]).slice(0, 10)
      for (const [kanji, usage] of sortedLowUsage) {
        console.log(`    ${kanji}: ${usage}回`)
      }
      if (lowUsageKanji.length > 10) {
        console.log(`    ... 他 ${lowUsageKanji.length - 10} 個`)
      }
    }
  }

  // エラーサマリー
  console.log('\n\n📋 エラーサマリー:')
  console.log('=====================================')
  console.log(`重複漢字エラー: ${result.duplicateKanjiErrors.length} 件`)
  console.log(`重複文章: ${result.duplicateSentences.length} 件`)
  console.log(`重複ID: ${result.duplicateIds.length} 件`)
  console.log(`短い文章 (9文字未満): ${result.shortSentences.length} 件`)

  const totalLowFrequency = Object.values(result.kanjiUsageStats).reduce((count, stats) => {
    return count + Object.values(stats).filter((usage) => usage < 5).length
  }, 0)
  console.log(`低頻度漢字 (5回未満): ${totalLowFrequency} 個`)

  // 総合判定
  const hasErrors =
    result.duplicateKanjiErrors.length > 0 ||
    result.duplicateSentences.length > 0 ||
    result.duplicateIds.length > 0 ||
    result.shortSentences.length > 0 ||
    totalLowFrequency > 0

  if (!hasErrors) {
    console.log('\n✅ すべての検証に合格しました！')
    process.exit(0)
  } else {
    console.log('\n❌ 修正が必要な項目があります')
    process.exit(1)
  }
}

main()
