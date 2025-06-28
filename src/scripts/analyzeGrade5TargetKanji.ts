#!/usr/bin/env tsx

import * as fs from 'node:fs'
import * as path from 'node:path'

import { EDUCATION_KANJI } from '../data/kanji-lists/education-kanji'
import { MIDDLE_SCHOOL_KANJI } from '../data/kanji-lists/jouyou-kanji'

interface Question {
  id: string
  sentence: string
}

interface Issue {
  id: string
  file: string
  sentence: string
  targetKanji: string[]
  wrongGradeKanji: { kanji: string; grade: string }[]
  needsCorrection: boolean
  reason?: string
}

// 漢字の学年を取得
function getGradeForKanji(kanji: string): string {
  for (let grade = 1; grade <= 6; grade++) {
    const gradeKanji = EDUCATION_KANJI[grade as keyof typeof EDUCATION_KANJI] || []
    if (gradeKanji.includes(kanji)) {
      return `${grade}年`
    }
  }
  if (MIDDLE_SCHOOL_KANJI.includes(kanji)) {
    return '中学'
  }
  return '不明'
}

// 5年生の漢字セット
const grade5Kanji = new Set(EDUCATION_KANJI[5])

console.log('🔍 小学5年生 学習対象漢字分析')
console.log('================================================================================')

const questionsDir = path.join(process.cwd(), 'src/data/questions')
const pattern = /questions-elementary5-part\d+\.json$/
const files = fs.readdirSync(questionsDir).filter((file) => pattern.test(file))

const issues: Issue[] = []
const statistics = {
  total: 0,
  needsCorrection: 0,
  compoundRuleOk: 0,
  byGrade: {} as Record<string, number>,
}

// 各ファイルを分析
for (const file of files) {
  const filePath = path.join(questionsDir, file)
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  for (const question of data.questions as Question[]) {
    // 学習対象の漢字（[漢字|読み]）を抽出
    const targetMatches = question.sentence.match(/\[([^|]+)\|[^\]]+\]/g) || []

    for (const match of targetMatches) {
      const kanjiPart = match.match(/\[([^|]+)\|/)?.[1]
      if (!kanjiPart) continue

      const kanjiInTarget = kanjiPart.match(/[\u4E00-\u9FAF]/g) || []
      const wrongGradeKanji: { kanji: string; grade: string }[] = []

      // 各漢字をチェック
      for (const k of kanjiInTarget) {
        if (!grade5Kanji.has(k)) {
          wrongGradeKanji.push({ kanji: k, grade: getGradeForKanji(k) })
        }
      }

      if (wrongGradeKanji.length > 0) {
        statistics.total++

        // 熟語ルール：熟語で5年生の漢字を含む場合はOK
        const has5thGradeKanji = kanjiInTarget.some((k) => grade5Kanji.has(k))
        const isCompound = kanjiInTarget.length > 1
        const needsCorrection = !(isCompound && has5thGradeKanji)

        if (needsCorrection) {
          statistics.needsCorrection++
        } else {
          statistics.compoundRuleOk++
        }

        // 統計を更新
        for (const { grade } of wrongGradeKanji) {
          statistics.byGrade[grade] = (statistics.byGrade[grade] || 0) + 1
        }

        issues.push({
          id: question.id,
          file,
          sentence: question.sentence,
          targetKanji: kanjiInTarget,
          wrongGradeKanji,
          needsCorrection,
          reason: !needsCorrection ? '熟語ルール（5年生の漢字を含む）' : undefined,
        })
      }
    }
  }
}

// 結果を表示
console.log('\n📊 分析結果:')
console.log(`総問題数: ${statistics.total}`)
console.log(`修正必要: ${statistics.needsCorrection}`)
console.log(`修正不要（熟語ルール）: ${statistics.compoundRuleOk}`)

console.log('\n学年別分布:')
for (const [grade, count] of Object.entries(statistics.byGrade)) {
  console.log(`  ${grade}: ${count}件`)
}

// 修正が必要な問題をJSON出力
const correctionsNeeded = issues.filter((i) => i.needsCorrection)
fs.writeFileSync(
  path.join(process.cwd(), 'grade5_corrections_needed.json'),
  JSON.stringify(
    {
      summary: statistics,
      corrections: correctionsNeeded,
    },
    null,
    2
  )
)

console.log(`\n✅ 修正が必要な${correctionsNeeded.length}件の問題を grade5_corrections_needed.json に出力しました。`)
