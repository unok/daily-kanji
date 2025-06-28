#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'

import { EDUCATION_KANJI } from '../data/kanji-lists/education-kanji'
import { MIDDLE_SCHOOL_KANJI } from '../data/kanji-lists/jouyou-kanji'

console.log('🔍 総合漢字検証ツール (TypeScript版)')
console.log('================================================================================')
console.log('以下の項目を検証します：')
console.log('1. 学習対象の漢字（[漢字|読み]）がその学年の漢字であること')
console.log('2. 問題文中の漢字がその学年までに習った漢字であること')
console.log('3. 入力漢字（[漢字|読み]形式）が存在すること')
console.log('4. 漢字リストの整合性')
console.log()

interface Question {
  id: string
  sentence: string
}

interface QuestionsFile {
  questions: Question[]
}

interface ValidationResult {
  hasError: boolean
  errorCount: number
  warningCount: number
  details: string[]
}

// 漢字を抽出する正規表現
const kanjiRegex = /[\u4E00-\u9FAF]/g

// 各学年の漢字セットを作成（その学年のみ）
function getKanjiForGrade(grade: number): Set<string> {
  const kanjiSet = new Set<string>()

  if (grade <= 6) {
    // 小学校の場合：その学年の漢字のみ
    const gradeKanji = EDUCATION_KANJI[grade as keyof typeof EDUCATION_KANJI] || []
    for (const k of gradeKanji) {
      kanjiSet.add(k)
    }
  } else if (grade === 7) {
    // 中学校の場合：中学校の漢字のみ
    for (const k of MIDDLE_SCHOOL_KANJI) {
      kanjiSet.add(k)
    }
  }

  return kanjiSet
}

// 各学年までに習う漢字のセットを作成（累積）
function getKanjiUpToGrade(grade: number): Set<string> {
  const kanjiSet = new Set<string>()

  if (grade <= 6) {
    // 小学校の場合
    for (let g = 1; g <= grade; g++) {
      const gradeKanji = EDUCATION_KANJI[g as keyof typeof EDUCATION_KANJI] || []
      for (const k of gradeKanji) {
        kanjiSet.add(k)
      }
    }
  } else if (grade === 7) {
    // 中学校の場合（小学校全部＋中学校）
    for (let g = 1; g <= 6; g++) {
      const gradeKanji = EDUCATION_KANJI[g as keyof typeof EDUCATION_KANJI] || []
      for (const k of gradeKanji) {
        kanjiSet.add(k)
      }
    }
    for (const k of MIDDLE_SCHOOL_KANJI) {
      kanjiSet.add(k)
    }
  }

  return kanjiSet
}

// 学年ごとのファイルパターン
const gradePatterns = [
  { grade: 1, pattern: /questions-elementary1-part\d+\.json$/, name: '小学1年生' },
  { grade: 2, pattern: /questions-elementary2-part\d+\.json$/, name: '小学2年生' },
  { grade: 3, pattern: /questions-elementary3-part\d+\.json$/, name: '小学3年生' },
  { grade: 4, pattern: /questions-elementary4-part\d+\.json$/, name: '小学4年生' },
  { grade: 5, pattern: /questions-elementary5-part\d+\.json$/, name: '小学5年生' },
  { grade: 6, pattern: /questions-elementary6-part\d+\.json$/, name: '小学6年生' },
  { grade: 7, pattern: /questions-junior-part\d+\.json$/, name: '中学校' },
]

// 問題ファイルディレクトリ
const questionsDir = path.join(process.cwd(), 'src', 'data', 'questions')

// 1. 学年別漢字検証
function validateGradeKanji(): ValidationResult {
  console.log('\n=== 1. 学年別漢字検証 ===')

  const targetKanjiIssues: string[] = []
  const sentenceKanjiIssues: string[] = []

  for (const { grade, pattern, name } of gradePatterns) {
    const targetKanjiForGrade = getKanjiForGrade(grade)
    const allowedKanjiUpToGrade = getKanjiUpToGrade(grade)

    console.log(`\n${name}の検証:`)

    const files = fs.readdirSync(questionsDir).filter((file) => pattern.test(file))

    let targetIssueCount = 0
    let sentenceIssueCount = 0

    for (const file of files) {
      const filePath = path.join(questionsDir, file)
      const content = fs.readFileSync(filePath, 'utf8')
      const data: QuestionsFile = JSON.parse(content)

      for (const question of data.questions) {
        // 1. 学習対象の漢字（[漢字|読み]）がその学年の漢字かチェック
        const targetKanjiMatches = question.sentence.match(/\[([^|]+)\|[^\]]+\]/g) || []

        for (const match of targetKanjiMatches) {
          const kanjiPart = match.match(/\[([^|]+)\|/)?.[1]
          if (kanjiPart) {
            const kanjiInTarget = kanjiPart.match(kanjiRegex) || []

            // 熟語の場合、その学年の漢字が1つでも含まれていればOK
            const hasGradeKanji = kanjiInTarget.some((k) => targetKanjiForGrade.has(k))

            if (kanjiInTarget.length > 1 && hasGradeKanji) {
              // 熟語で、その学年の漢字を含む場合はOK
              continue
            }

            // 単漢字の場合、または熟語でもその学年の漢字を含まない場合
            const wrongGradeKanji = kanjiInTarget.filter((k) => !targetKanjiForGrade.has(k))
            if (wrongGradeKanji.length > 0) {
              targetIssueCount++
              if (targetKanjiIssues.length < 5) {
                targetKanjiIssues.push(`${name} ${file} (${question.id}): ${wrongGradeKanji.join(', ')}`)
              }
            }
          }
        }

        // 2. 問題文全体の漢字がその学年までに習った漢字かチェック
        const sentenceWithoutTargets = question.sentence.replace(/\[[^\]]+\]/g, '')
        const kanjiInSentence = sentenceWithoutTargets.match(kanjiRegex) || []
        const uniqueSentenceKanji = [...new Set(kanjiInSentence)]
        const unlearnedKanji = uniqueSentenceKanji.filter((k) => !allowedKanjiUpToGrade.has(k))

        if (unlearnedKanji.length > 0) {
          sentenceIssueCount++
          if (sentenceKanjiIssues.length < 5) {
            sentenceKanjiIssues.push(`${name} ${file} (${question.id}): ${unlearnedKanji.join(', ')}`)
          }
        }
      }
    }

    // 結果表示
    if (targetIssueCount === 0) {
      console.log('  ✅ 学習対象漢字: 全て適切な学年の漢字です')
    } else {
      console.log(`  ❌ 学習対象漢字: ${targetIssueCount}個の問題で他学年の漢字が使用されています`)
    }

    if (sentenceIssueCount === 0) {
      console.log('  ✅ 問題文中の漢字: 全てその学年までに習った漢字のみを使用')
    } else {
      console.log(`  ⚠️  問題文中の漢字: ${sentenceIssueCount}個の問題に未習漢字が含まれています`)
    }
  }

  const hasError = targetKanjiIssues.length > 0

  return {
    hasError,
    errorCount: targetKanjiIssues.length,
    warningCount: sentenceKanjiIssues.length,
    details: [...targetKanjiIssues, ...sentenceKanjiIssues],
  }
}

// 2. 入力漢字存在チェック
function validateInputKanjiExists(): ValidationResult {
  console.log('\n=== 2. 入力漢字の存在チェック ===')

  const issues: string[] = []
  const fileIssues: { [file: string]: number } = {}

  const files = fs.readdirSync(questionsDir).filter((file) => file.match(/questions-.*\.json$/))

  for (const file of files) {
    const filePath = path.join(questionsDir, file)
    const content = fs.readFileSync(filePath, 'utf8')
    const data: QuestionsFile = JSON.parse(content)

    let fileIssueCount = 0

    for (const question of data.questions) {
      // [漢字|読み]形式があるかチェック
      const hasInputKanji = /\[[^\]]+\|[^\]]+\]/.test(question.sentence)

      if (!hasInputKanji) {
        fileIssueCount++
        if (issues.length < 10) {
          issues.push(`${file} (${question.id}): ${question.sentence}`)
        }
      }
    }

    if (fileIssueCount > 0) {
      fileIssues[file] = fileIssueCount
    }
  }

  // 結果表示
  const totalIssues = Object.values(fileIssues).reduce((sum, count) => sum + count, 0)

  if (totalIssues === 0) {
    console.log('✅ 全ての問題に入力漢字が存在します')
  } else {
    console.log(`❌ ${totalIssues}個の問題で入力漢字がありません`)

    for (const [file, count] of Object.entries(fileIssues)) {
      const grade = file.match(/elementary(\d)/) ? `elementary${file.match(/elementary(\d)/)?.[1]}` : file.match(/junior/) ? 'junior' : 'unknown'
      console.log(`  - ${grade}: ${count}件`)
    }
  }

  return {
    hasError: totalIssues > 0,
    errorCount: totalIssues,
    warningCount: 0,
    details: issues,
  }
}

// 3. 漢字リストの整合性チェック
function validateKanjiListIntegrity(): ValidationResult {
  console.log('\n=== 3. 漢字リストの整合性チェック ===')

  const issues: string[] = []

  // 教育漢字の総数をチェック
  let educationKanjiCount = 0
  for (let grade = 1; grade <= 6; grade++) {
    const gradeKanji = EDUCATION_KANJI[grade as keyof typeof EDUCATION_KANJI] || []
    educationKanjiCount += gradeKanji.length
    console.log(`  小学${grade}年生: ${gradeKanji.length}字`)
  }

  console.log(`  教育漢字合計: ${educationKanjiCount}字`)

  if (educationKanjiCount !== 1026) {
    issues.push(`教育漢字の総数が不正です: ${educationKanjiCount}字 (正: 1026字)`)
  }

  // 中学校の漢字数をチェック
  console.log(`  中学校: ${MIDDLE_SCHOOL_KANJI.length}字`)

  // 重複チェック
  const allKanji = new Set<string>()
  const duplicates: string[] = []

  // 教育漢字の重複チェック
  for (let grade = 1; grade <= 6; grade++) {
    const gradeKanji = EDUCATION_KANJI[grade as keyof typeof EDUCATION_KANJI] || []
    for (const kanji of gradeKanji) {
      if (allKanji.has(kanji)) {
        duplicates.push(`${kanji} (小学${grade}年)`)
      }
      allKanji.add(kanji)
    }
  }

  // 中学校漢字との重複チェック
  for (const kanji of MIDDLE_SCHOOL_KANJI) {
    if (allKanji.has(kanji)) {
      duplicates.push(`${kanji} (中学校)`)
    }
    allKanji.add(kanji)
  }

  if (duplicates.length > 0) {
    console.log(`\n⚠️  重複している漢字: ${duplicates.length}個`)
    for (const d of duplicates.slice(0, 10)) {
      console.log(`  - ${d}`)
    }
    if (duplicates.length > 10) {
      console.log(`  ... 他${duplicates.length - 10}個`)
    }
    issues.push(`${duplicates.length}個の漢字が重複しています`)
  } else {
    console.log('\n✅ 漢字の重複はありません')
  }

  return {
    hasError: issues.length > 0,
    errorCount: issues.length,
    warningCount: duplicates.length,
    details: issues,
  }
}

// 4. 総合サマリー
function showSummary(results: { [key: string]: ValidationResult }) {
  console.log('\n================================================================================')
  console.log('📊 検証結果サマリー')
  console.log('================================================================================')

  let totalErrors = 0
  let totalWarnings = 0

  for (const [, result] of Object.entries(results)) {
    totalErrors += result.errorCount
    totalWarnings += result.warningCount
  }

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('✅ 全ての検証項目をクリアしました！')
  } else {
    if (totalErrors > 0) {
      console.log(`\n❌ エラー: ${totalErrors}件`)
      console.log('   これらは修正が必要です。')
    }

    if (totalWarnings > 0) {
      console.log(`\n⚠️  警告: ${totalWarnings}件`)
      console.log('   これらは文章の理解に必要な場合は許容されます。')
    }
  }

  // エラーがある場合は終了コード1
  if (totalErrors > 0) {
    process.exit(1)
  }
}

// メイン処理
function main() {
  const results: { [key: string]: ValidationResult } = {}

  // 各種検証を実行
  results.学年別漢字 = validateGradeKanji()
  results.入力漢字存在 = validateInputKanjiExists()
  results.漢字リスト整合性 = validateKanjiListIntegrity()

  // サマリー表示
  showSummary(results)
}

// 実行
main()
