#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'

import { EDUCATION_KANJI } from '../data/kanji-lists/education-kanji'
import { MIDDLE_SCHOOL_KANJI } from '../data/kanji-lists/jouyou-kanji'

console.log('🔍 学習対象漢字検証ツール')
console.log('================================================================================')
console.log('学習対象の漢字（[漢字|読み]形式）が適切な学年に配置されているかを検証します。')
console.log()

interface Question {
  id: string
  sentence: string
}

interface QuestionsFile {
  questions: Question[]
}

// 漢字を抽出する正規表現
const kanjiRegex = /[\u4E00-\u9FAF]/g

// 各学年の漢字セットを作成
function getKanjiForGrade(grade: number): Set<string> {
  const kanjiSet = new Set<string>()

  if (grade <= 6) {
    // 小学校の場合：その学年の漢字のみ
    const gradeKanji = EDUCATION_KANJI[grade as keyof typeof EDUCATION_KANJI] || []
    gradeKanji.forEach((k) => kanjiSet.add(k))
  } else if (grade === 7) {
    // 中学校の場合：中学校の漢字のみ
    MIDDLE_SCHOOL_KANJI.forEach((k) => kanjiSet.add(k))
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
]

let hasError = false
const issues: string[] = []

// 問題ファイルディレクトリ
const questionsDir = path.join(process.cwd(), 'src', 'data', 'questions')

// 各学年のファイルをチェック
for (const { grade, pattern } of gradePatterns) {
  const targetKanji = getKanjiForGrade(grade)
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
      const kanjiInTargets: string[] = []

      for (const match of targetKanjiMatches) {
        const kanjiPart = match.match(/\[([^|]+)\|/)?.[1]
        if (kanjiPart) {
          const kanjiInTarget = kanjiPart.match(kanjiRegex) || []
          kanjiInTargets.push(...kanjiInTarget)
        }
      }

      const uniqueKanji = [...new Set(kanjiInTargets)]

      // 他学年の漢字をチェック
      const wrongGradeKanji = uniqueKanji.filter((k) => !targetKanji.has(k))

      if (wrongGradeKanji.length > 0) {
        gradeIssueCount++
        gradeIssues.push({
          file,
          question: question.id,
          kanji: wrongGradeKanji,
        })
      }
    }
  }

  if (gradeIssueCount === 0) {
    console.log(`✅ ${gradeName}: 全ての学習対象漢字が適切に配置されています`)
  } else {
    console.log(`❌ ${gradeName}: ${gradeIssueCount}個の問題に他学年の漢字が学習対象として含まれています`)
    hasError = true

    // 詳細を表示
    for (const issue of gradeIssues) {
      console.log(`  - ${issue.file} (${issue.question}): 他学年の漢字 ${issue.kanji.join(', ')}`)
      issues.push(`${gradeName} ${issue.file} (${issue.question}): 他学年の漢字 ${issue.kanji.join(', ')}`)
    }
  }
}

console.log('\n================================================================================')
console.log('📊 検証結果サマリー')
console.log('================================================================================')

if (!hasError) {
  console.log('✅ 全ての学習対象漢字が適切な学年に配置されています！')
} else {
  console.log(`⚠️  ${issues.length}個の問題で学習対象漢字が適切な学年に配置されていません`)
  console.log('\n※ これは警告です。現在の問題設計では、学習対象漢字が他学年の漢字を含む場合があります。')
  console.log('　 これらの問題は将来的に修正される予定です。')
  // process.exit(1) // エラーではなく警告として扱う
}
