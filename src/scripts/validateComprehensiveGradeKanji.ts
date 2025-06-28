#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'

import { EDUCATION_KANJI } from '../data/kanji-lists/education-kanji'
import { ACTUAL_JUNIOR_KANJI } from '../data/kanji-lists/jouyou-kanji'

console.log('🔍 総合学年別漢字検証ツール')
console.log('================================================================================')
console.log('1. 学習対象の漢字（[漢字|読み]）がその学年の漢字であること')
console.log('2. 問題文中の漢字がその学年までに習った漢字であること')
console.log('を検証します。')
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

// 各学年の漢字セットを作成（その学年のみ）
function getKanjiForGrade(grade: number): Set<string> {
  const kanjiSet = new Set<string>()

  if (grade <= 6) {
    // 小学校の場合：その学年の漢字のみ
    const gradeKanji = EDUCATION_KANJI[grade as keyof typeof EDUCATION_KANJI] || []
    gradeKanji.forEach((k) => kanjiSet.add(k))
  } else if (grade === 7) {
    // 中学校の場合：中学校の漢字のみ
    ACTUAL_JUNIOR_KANJI.forEach((k) => kanjiSet.add(k))
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
      gradeKanji.forEach((k) => kanjiSet.add(k))
    }
  } else if (grade === 7) {
    // 中学校の場合（小学校全部＋中学校）
    for (let g = 1; g <= 6; g++) {
      const gradeKanji = EDUCATION_KANJI[g as keyof typeof EDUCATION_KANJI] || []
      gradeKanji.forEach((k) => kanjiSet.add(k))
    }
    ACTUAL_JUNIOR_KANJI.forEach((k) => kanjiSet.add(k))
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

const targetKanjiIssues: string[] = []
const sentenceKanjiIssues: string[] = []

// 問題ファイルディレクトリ
const questionsDir = path.join(process.cwd(), 'src', 'data', 'questions')

// 各学年のファイルをチェック
for (const { grade, pattern } of gradePatterns) {
  const targetKanjiForGrade = getKanjiForGrade(grade) // その学年の漢字
  const allowedKanjiUpToGrade = getKanjiUpToGrade(grade) // その学年までの漢字
  const gradeName = grade <= 6 ? `小学${grade}年生` : grade === 7 ? '中学校' : '高校'

  console.log(`\n=== ${gradeName}の検証 ===`)

  const files = fs.readdirSync(questionsDir).filter((file) => pattern.test(file))

  let targetIssueCount = 0
  let sentenceIssueCount = 0
  const gradeTargetIssues: Array<{ file: string; question: string; kanji: string[] }> = []
  const gradeSentenceIssues: Array<{ file: string; question: string; kanji: string[] }> = []

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
            gradeTargetIssues.push({
              file,
              question: question.id,
              kanji: wrongGradeKanji,
            })
          }
        }
      }

      // 2. 問題文全体の漢字がその学年までに習った漢字かチェック
      // [漢字|読み]を一時的に削除してから漢字を抽出
      const sentenceWithoutTargets = question.sentence.replace(/\[[^\]]+\]/g, '')
      const kanjiInSentence = sentenceWithoutTargets.match(kanjiRegex) || []
      const uniqueSentenceKanji = [...new Set(kanjiInSentence)]
      const unlearnedKanji = uniqueSentenceKanji.filter((k) => !allowedKanjiUpToGrade.has(k))

      if (unlearnedKanji.length > 0) {
        sentenceIssueCount++
        gradeSentenceIssues.push({
          file,
          question: question.id,
          kanji: unlearnedKanji,
        })
      }
    }
  }

  // 結果表示
  console.log('\n1. 学習対象漢字の検証:')
  if (targetIssueCount === 0) {
    console.log(`✅ ${gradeName}: 全ての学習対象漢字が適切な学年の漢字です`)
  } else {
    console.log(`❌ ${gradeName}: ${targetIssueCount}個の問題で他学年の漢字が学習対象になっています`)

    // 詳細を表示（最初の5件のみ）
    const displayCount = Math.min(5, gradeTargetIssues.length)
    for (let i = 0; i < displayCount; i++) {
      const issue = gradeTargetIssues[i]
      console.log(`  - ${issue.file} (${issue.question}): ${issue.kanji.join(', ')}`)
      targetKanjiIssues.push(`${gradeName} ${issue.file} (${issue.question}): ${issue.kanji.join(', ')}`)
    }
    if (gradeTargetIssues.length > 5) {
      console.log(`  ... 他${gradeTargetIssues.length - 5}件`)
    }
  }

  console.log('\n2. 問題文中の漢字の検証:')
  if (sentenceIssueCount === 0) {
    console.log(`✅ ${gradeName}: 全ての問題文がその学年までに習った漢字のみを使用`)
  } else {
    console.log(`⚠️  ${gradeName}: ${sentenceIssueCount}個の問題に未習漢字が含まれています`)

    // 詳細を表示（最初の5件のみ）
    const displayCount = Math.min(5, gradeSentenceIssues.length)
    for (let i = 0; i < displayCount; i++) {
      const issue = gradeSentenceIssues[i]
      console.log(`  - ${issue.file} (${issue.question}): ${issue.kanji.join(', ')}`)
      sentenceKanjiIssues.push(`${gradeName} ${issue.file} (${issue.question}): ${issue.kanji.join(', ')}`)
    }
    if (gradeSentenceIssues.length > 5) {
      console.log(`  ... 他${gradeSentenceIssues.length - 5}件`)
    }
  }
}

console.log('\n================================================================================')
console.log('📊 検証結果サマリー')
console.log('================================================================================')

if (targetKanjiIssues.length === 0 && sentenceKanjiIssues.length === 0) {
  console.log('✅ 全ての検証項目をクリアしました！')
} else {
  if (targetKanjiIssues.length > 0) {
    console.log(`\n❌ 学習対象漢字の問題: ${targetKanjiIssues.length}件`)
    console.log('   これらは修正が必要です。')
  }

  if (sentenceKanjiIssues.length > 0) {
    console.log(`\n⚠️  問題文中の未習漢字: ${sentenceKanjiIssues.length}件`)
    console.log('   これは警告です。文章の理解に必要な場合は許容されます。')
  }

  // 現状では警告として扱う
  // if (hasError) {
  //   process.exit(1)
  // }
}
