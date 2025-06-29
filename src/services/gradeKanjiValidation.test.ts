import { describe, expect, it } from 'vitest'

import * as fs from 'node:fs'
import * as path from 'node:path'

import { EDUCATION_KANJI } from '../data/kanji-lists/education-kanji'
import { ACTUAL_JUNIOR_KANJI } from '../data/kanji-lists/jouyou-kanji'

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
    for (const k of ACTUAL_JUNIOR_KANJI) {
      kanjiSet.add(k)
    }
  } else if (grade === 8) {
    // 高校の場合（小学校全部＋中学校＋高校）
    for (let g = 1; g <= 6; g++) {
      const gradeKanji = EDUCATION_KANJI[g as keyof typeof EDUCATION_KANJI] || []
      for (const k of gradeKanji) {
        kanjiSet.add(k)
      }
    }
    for (const k of ACTUAL_JUNIOR_KANJI) {
      kanjiSet.add(k)
    }
  }

  return kanjiSet
}

describe.skip('学年別漢字検証', () => {
  const questionsDir = path.join(process.cwd(), 'src', 'data', 'questions')

  // 各学年のテスト
  const grades = [
    { grade: 1, name: '小学1年生', pattern: /questions-elementary1-part\d+\.json$/ },
    { grade: 2, name: '小学2年生', pattern: /questions-elementary2-part\d+\.json$/ },
    { grade: 3, name: '小学3年生', pattern: /questions-elementary3-part\d+\.json$/ },
    { grade: 4, name: '小学4年生', pattern: /questions-elementary4-part\d+\.json$/ },
    { grade: 5, name: '小学5年生', pattern: /questions-elementary5-part\d+\.json$/ },
    { grade: 6, name: '小学6年生', pattern: /questions-elementary6-part\d+\.json$/ },
    { grade: 7, name: '中学校', pattern: /questions-junior-part\d+\.json$/ },
    { grade: 8, name: '高校', pattern: /questions-senior-part\d+\.json$/ },
  ]

  for (const { grade, name, pattern } of grades) {
    it(`${name}の問題に未習漢字が含まれていない`, () => {
      const allowedKanji = getKanjiUpToGrade(grade)
      const files = fs.readdirSync(questionsDir).filter((file) => pattern.test(file))

      const issues: Array<{ file: string; question: string; kanji: string[] }> = []

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
            issues.push({
              file,
              question: question.id,
              kanji: unlearned,
            })
          }
        }
      }

      if (issues.length > 0) {
        expect(issues).toHaveLength(0)
      }
    })
  }

  it('高校追加問題に未習漢字が含まれていない', () => {
    const additionalFile = path.join(questionsDir, 'questions-senior-additional.json')

    if (fs.existsSync(additionalFile)) {
      const allowedKanji = getKanjiUpToGrade(8) // 高校レベル
      const content = fs.readFileSync(additionalFile, 'utf8')
      const data: QuestionsFile = JSON.parse(content)

      const issues: Array<{ question: string; kanji: string[] }> = []

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
          issues.push({
            question: question.id,
            kanji: unlearned,
          })
        }
      }

      if (issues.length > 0) {
        expect(issues).toHaveLength(0)
      }
    }
  })
})
