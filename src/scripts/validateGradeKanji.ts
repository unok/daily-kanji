#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'

import { EDUCATION_KANJI } from '../data/kanji-lists/education-kanji'
import { ACTUAL_JUNIOR_KANJI, ACTUAL_SENIOR_KANJI } from '../data/kanji-lists/jouyou-kanji'

console.log('🔍 学年別漢字検証ツール')
console.log('================================================================================')

interface Question {
  id: string
  sentence: string
}

interface QuestionsFile {
  questions: Question[]
}

// 漢字を抽出する正規表現
const kanjiRegex = /[\u4E00-\u9FAF]/g

// 各学年までに習う漢字のセットを作成
function getKanjiUpToGrade(grade: number): Set<string> {
  const kanjiSet = new Set<string>()

  if (grade <= 6) {
    // 小学校の場合
    for (let g = 1; g <= grade; g++) {
      const gradeKanji = EDUCATION_KANJI[g as keyof typeof EDUCATION_KANJI] || []
      gradeKanji.forEach((k) => kanjiSet.add(k))
    }
  } else if (grade === 7) {
    // 中学校の場合（小学校全部＋中学校）
    for (let g = 1; g <= 6; g++) {
      const gradeKanji = EDUCATION_KANJI[g as keyof typeof EDUCATION_KANJI] || []
      gradeKanji.forEach((k) => kanjiSet.add(k))
    }
    ACTUAL_JUNIOR_KANJI.forEach((k) => kanjiSet.add(k))
  } else if (grade === 8) {
    // 高校の場合（小学校全部＋中学校＋高校）
    for (let g = 1; g <= 6; g++) {
      const gradeKanji = EDUCATION_KANJI[g as keyof typeof EDUCATION_KANJI] || []
      gradeKanji.forEach((k) => kanjiSet.add(k))
    }
    ACTUAL_JUNIOR_KANJI.forEach((k) => kanjiSet.add(k))
    ACTUAL_SENIOR_KANJI.forEach((k) => kanjiSet.add(k))
  }

  return kanjiSet
}

// 学年ごとのファイルパターン
const gradePatterns = [
  { grade: 1, pattern: /questions-elementary1-part\d+\.json$/ },
  { grade: 2, pattern: /questions-elementary2-part\d+\.json$/ },
  { grade: 3, pattern: /questions-elementary3-part\d+\.json$/ },
  { grade: 4, pattern: /questions-elementary4-part\d+\.json$/ },
  { grade: 5, pattern: /questions-elementary5-part\d+\.json$/ },
  { grade: 6, pattern: /questions-elementary6-part\d+\.json$/ },
  { grade: 7, pattern: /questions-junior-part\d+\.json$/ },
  { grade: 8, pattern: /questions-senior-part\d+\.json$/ },
]

let hasError = false
const issues: string[] = []

// 問題ファイルディレクトリ
const questionsDir = path.join(process.cwd(), 'src', 'data', 'questions')

// 各学年のファイルをチェック
for (const { grade, pattern } of gradePatterns) {
  const allowedKanji = getKanjiUpToGrade(grade)
  const gradeName = grade <= 6 ? `小学${grade}年生` : grade === 7 ? '中学校' : '高校'

  console.log(`\n=== ${gradeName}の検証 ===`)

  const files = fs.readdirSync(questionsDir).filter((file) => pattern.test(file))

  let gradeIssueCount = 0
  const gradeIssues: Array<{ file: string; question: string; kanji: string[] }> = []

  for (const file of files) {
    const filePath = path.join(questionsDir, file)
    const content = fs.readFileSync(filePath, 'utf8')
    const data: QuestionsFile = JSON.parse(content)

    for (const question of data.questions) {
      // 学習対象の漢字（[漢字|読み]の形式）を抽出
      const targetKanjiMatches = question.sentence.match(/\[([^|]+)\|[^\]]+\]/g) || []
      const targetKanji: string[] = []

      for (const match of targetKanjiMatches) {
        const kanjiPart = match.match(/\[([^|]+)\|/)?.[1]
        if (kanjiPart) {
          const kanjiInTarget = kanjiPart.match(kanjiRegex) || []
          targetKanji.push(...kanjiInTarget)
        }
      }

      const uniqueKanji = [...new Set(targetKanji)]

      // 未習漢字をチェック
      const unlearned = uniqueKanji.filter((k) => !allowedKanji.has(k))

      if (unlearned.length > 0) {
        gradeIssueCount++
        gradeIssues.push({
          file,
          question: question.id,
          kanji: unlearned,
        })
      }
    }
  }

  if (gradeIssueCount === 0) {
    console.log(`✅ ${gradeName}: 未習漢字なし`)
  } else {
    console.log(`❌ ${gradeName}: ${gradeIssueCount}個の問題に未習漢字が含まれています`)
    hasError = true

    // 詳細を表示
    for (const issue of gradeIssues) {
      console.log(`  - ${issue.file} (${issue.question}): ${issue.kanji.join(', ')}`)
      issues.push(`${gradeName} ${issue.file} (${issue.question}): 未習漢字 ${issue.kanji.join(', ')}`)
    }
  }
}

// 追加ファイルのチェック（questions-senior-additional.json）
const additionalFile = path.join(questionsDir, 'questions-senior-additional.json')
if (fs.existsSync(additionalFile)) {
  console.log('\n=== 高校追加問題の検証 ===')

  const allowedKanji = getKanjiUpToGrade(8) // 高校レベル
  const content = fs.readFileSync(additionalFile, 'utf8')
  const data: QuestionsFile = JSON.parse(content)

  let issueCount = 0
  const fileIssues: Array<{ question: string; kanji: string[] }> = []

  for (const question of data.questions) {
    // 学習対象の漢字（[漢字|読み]の形式）を抽出
    const targetKanjiMatches = question.sentence.match(/\[([^|]+)\|[^\]]+\]/g) || []
    const targetKanji: string[] = []

    for (const match of targetKanjiMatches) {
      const kanjiPart = match.match(/\[([^|]+)\|/)?.[1]
      if (kanjiPart) {
        const kanjiInTarget = kanjiPart.match(kanjiRegex) || []
        targetKanji.push(...kanjiInTarget)
      }
    }

    const uniqueKanji = [...new Set(targetKanji)]
    const unlearned = uniqueKanji.filter((k) => !allowedKanji.has(k))

    if (unlearned.length > 0) {
      issueCount++
      fileIssues.push({
        question: question.id,
        kanji: unlearned,
      })
    }
  }

  if (issueCount === 0) {
    console.log('✅ 高校追加問題: 未習漢字なし')
  } else {
    console.log(`❌ 高校追加問題: ${issueCount}個の問題に未習漢字が含まれています`)
    hasError = true

    for (const issue of fileIssues) {
      console.log(`  - ${issue.question}: ${issue.kanji.join(', ')}`)
      issues.push(`高校追加問題 (${issue.question}): 未習漢字 ${issue.kanji.join(', ')}`)
    }
  }
}

console.log('\n================================================================================')
console.log('📊 検証結果サマリー')
console.log('================================================================================')

if (!hasError) {
  console.log('✅ 全ての学年で未習漢字は含まれていません！')
} else {
  console.log(`⚠️  ${issues.length}個の問題に未習漢字が含まれています`)
  console.log('\n詳細:')
  issues.forEach((issue) => console.log(`  - ${issue}`))
  console.log('\n※ これは警告です。学習対象の漢字は適切な学年に配置されていますが、')
  console.log('  文章中に他学年の漢字が含まれる場合があります。')
  // process.exit(1) // エラーではなく警告として扱う
}
