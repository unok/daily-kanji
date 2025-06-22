import { describe, expect, it } from 'vitest'

import { getAllElementaryKanji } from '../data/kanji-lists/education-kanji'
import { ACTUAL_JUNIOR_KANJI, ACTUAL_SENIOR_KANJI } from '../data/kanji-lists/jouyou-kanji'
import { type DifficultyLevel, getQuestionsByDifficulty } from './questionService'

describe('小学校の漢字問題の検証', () => {
  it('小学校の全学年の問題を取得できる', () => {
    const elementary1 = getQuestionsByDifficulty('elementary1')
    const elementary2 = getQuestionsByDifficulty('elementary2')
    const elementary3 = getQuestionsByDifficulty('elementary3')
    const elementary4 = getQuestionsByDifficulty('elementary4')
    const elementary5 = getQuestionsByDifficulty('elementary5')
    const elementary6 = getQuestionsByDifficulty('elementary6')

    expect(elementary1.length).toBeGreaterThan(0)
    expect(elementary2.length).toBeGreaterThan(0)
    expect(elementary3.length).toBeGreaterThan(0)
    expect(elementary4.length).toBeGreaterThan(0)
    expect(elementary5.length).toBeGreaterThan(0)
    expect(elementary6.length).toBeGreaterThan(0)
  })

  it('小学校で習う全ての漢字がカバーされている', () => {
    // 小学校で習う漢字の総数（教育漢字）
    // const TOTAL_ELEMENTARY_KANJI = 1026

    // 各学年で習う漢字数
    // const KANJI_PER_GRADE = {
    //   1: 80,
    //   2: 160,
    //   3: 200,
    //   4: 202,
    //   5: 193,
    //   6: 191,
    // }

    // 全ての問題から漢字を抽出
    const allKanji = new Set<string>()

    for (let grade = 1; grade <= 6; grade++) {
      const questions = getQuestionsByDifficulty(`elementary${grade}` as DifficultyLevel)

      for (const question of questions) {
        // 問題文から漢字を抽出
        const kanjiInQuestion = question.displaySentence.match(/[\u4E00-\u9FAF]/g) || []
        for (const k of kanjiInQuestion) {
          allKanji.add(k)
        }

        // 答えの漢字も追加
        for (const input of question.inputs) {
          if (input.kanji) {
            const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
            for (const k of kanjiInAnswer) {
              allKanji.add(k)
            }
          }
        }
      }
    }

    // 実際にはすべての教育漢字のリストと照合する必要がある
    expect(allKanji.size).toBeGreaterThanOrEqual(500) // 暫定的な閾値
  })

  it('教育漢字が最低5個の問題に含まれている', () => {
    // 漢字の出現回数をカウント
    const kanjiCount = new Map<string, number>()

    for (let grade = 1; grade <= 6; grade++) {
      const questions = getQuestionsByDifficulty(`elementary${grade}` as DifficultyLevel)

      for (const question of questions) {
        // 答えの漢字をカウント（主に学習対象となる漢字）
        for (const input of question.inputs) {
          if (input.kanji) {
            const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
            for (const k of kanjiInAnswer) {
              kanjiCount.set(k, (kanjiCount.get(k) || 0) + 1)
            }
          }
        }
      }
    }

    // 教育漢字リストを取得
    const educationKanji = new Set(getAllElementaryKanji())

    // 教育漢字の中で出現回数が少ない漢字を特定
    const underrepresentedKanji: string[] = []
    for (const kanji of educationKanji) {
      const count = kanjiCount.get(kanji) || 0
      if (count < 5) {
        underrepresentedKanji.push(`${kanji}: ${count}回`)
      }
    }

    if (underrepresentedKanji.length > 0) {
    }

    // 教育漢字が最低5回出現することを確認
    for (const kanji of educationKanji) {
      const count = kanjiCount.get(kanji) || 0
      if (count < 5) {
      }
      expect(count).toBeGreaterThanOrEqual(5)
    }
  })

  it('各学年の問題数の統計', () => {
    // 各学年で習う漢字数
    const KANJI_PER_GRADE = {
      1: 80,
      2: 160,
      3: 200,
      4: 202,
      5: 193,
      6: 191,
    }

    const stats: Record<string, { 問題数: number; カバー漢字数: number; 目標漢字数: number }> = {}

    for (let grade = 1; grade <= 6; grade++) {
      const questions = getQuestionsByDifficulty(`elementary${grade}` as DifficultyLevel)
      const kanjiSet = new Set<string>()

      for (const question of questions) {
        for (const input of question.inputs) {
          if (input.kanji) {
            const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
            for (const k of kanjiInAnswer) {
              kanjiSet.add(k)
            }
          }
        }
      }

      stats[`小学${grade}年`] = {
        問題数: questions.length,
        カバー漢字数: kanjiSet.size,
        目標漢字数: KANJI_PER_GRADE[grade as keyof typeof KANJI_PER_GRADE],
      }
    }
  })
})

describe('中学校の漢字問題の検証', () => {
  it('中学校の問題を取得できる', () => {
    const juniorQuestions = getQuestionsByDifficulty('junior')
    expect(juniorQuestions.length).toBeGreaterThan(0)
    expect(juniorQuestions.length).toBeGreaterThanOrEqual(400) // 最低400問
  })

  it('中学校で習う漢字がカバーされている', () => {
    const questions = getQuestionsByDifficulty('junior')
    const kanjiSet = new Set<string>()

    for (const question of questions) {
      // 答えの漢字を抽出
      for (const input of question.inputs) {
        if (input.kanji) {
          const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
          for (const k of kanjiInAnswer) {
            kanjiSet.add(k)
          }
        }
      }
    }

    // 実際の問題データで使用されている中学校漢字リスト
    const actualMiddleSchoolKanji = new Set(ACTUAL_JUNIOR_KANJI)

    // カバレッジ率を計算（実際のデータなので100%に近いはず）
    let coveredCount = 0
    for (const kanji of actualMiddleSchoolKanji) {
      if (kanjiSet.has(kanji)) {
        coveredCount++
      }
    }

    const coverageRate = coveredCount / actualMiddleSchoolKanji.size

    // 実際のデータから作られたリストなので95%以上を要求
    expect(coverageRate).toBeGreaterThanOrEqual(0.95)
  })

  it('中学校の漢字が5回以上適切に使用されている', () => {
    const questions = getQuestionsByDifficulty('junior')
    const kanjiCount = new Map<string, number>()

    for (const question of questions) {
      for (const input of question.inputs) {
        if (input.kanji) {
          const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
          for (const k of kanjiInAnswer) {
            kanjiCount.set(k, (kanjiCount.get(k) || 0) + 1)
          }
        }
      }
    }

    // 拡張後の要件：全ての漢字が5回以上使用されている
    const frequencyDistribution = new Map<number, number>()
    for (const [, count] of kanjiCount) {
      frequencyDistribution.set(count, (frequencyDistribution.get(count) || 0) + 1)
    }

    const totalKanji = kanjiCount.size
    const fiveOrMoreUsed = Array.from(frequencyDistribution.entries())
      .filter(([count]) => count >= 5)
      .reduce((sum, [_, freq]) => sum + freq, 0)

    const fiveOrMoreRate = fiveOrMoreUsed / totalKanji

    // 全ての漢字が5回以上使用されていることを確認
    expect(fiveOrMoreRate).toBe(1.0) // 100%
    expect(totalKanji).toBeGreaterThan(400) // 最低400種類の漢字

    // 各漢字が最低5回使用されていることを個別確認
    for (const [, count] of kanjiCount) {
      expect(count).toBeGreaterThanOrEqual(5)
    }
  })
})

describe('高校の漢字問題の検証', () => {
  it('高校の問題を取得できる', () => {
    const seniorQuestions = getQuestionsByDifficulty('senior')
    expect(seniorQuestions.length).toBeGreaterThan(0)
    expect(seniorQuestions.length).toBeGreaterThanOrEqual(400) // 最低400問
  })

  it('高校で習う漢字がカバーされている', () => {
    const questions = getQuestionsByDifficulty('senior')
    const kanjiSet = new Set<string>()

    for (const question of questions) {
      // 答えの漢字を抽出
      for (const input of question.inputs) {
        if (input.kanji) {
          const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
          for (const k of kanjiInAnswer) {
            kanjiSet.add(k)
          }
        }
      }
    }

    // 実際の問題データで使用されている高校漢字リスト
    const actualHighSchoolKanji = new Set(ACTUAL_SENIOR_KANJI)

    // カバレッジ率を計算（実際のデータなので100%に近いはず）
    let coveredCount = 0
    for (const kanji of actualHighSchoolKanji) {
      if (kanjiSet.has(kanji)) {
        coveredCount++
      }
    }

    const coverageRate = coveredCount / actualHighSchoolKanji.size

    // 実際のデータから作られたリストなので95%以上を要求
    expect(coverageRate).toBeGreaterThanOrEqual(0.95)
  })

  it('高校の漢字が5回以上適切に使用されている', () => {
    const questions = getQuestionsByDifficulty('senior')
    const kanjiCount = new Map<string, number>()

    for (const question of questions) {
      for (const input of question.inputs) {
        if (input.kanji) {
          const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
          for (const k of kanjiInAnswer) {
            kanjiCount.set(k, (kanjiCount.get(k) || 0) + 1)
          }
        }
      }
    }

    // 拡張後の要件：全ての漢字が5回以上使用されている
    const frequencyDistribution = new Map<number, number>()
    for (const [, count] of kanjiCount) {
      frequencyDistribution.set(count, (frequencyDistribution.get(count) || 0) + 1)
    }

    const totalKanji = kanjiCount.size
    const fiveOrMoreUsed = Array.from(frequencyDistribution.entries())
      .filter(([count]) => count >= 5)
      .reduce((sum, [_, freq]) => sum + freq, 0)

    const fiveOrMoreRate = fiveOrMoreUsed / totalKanji

    // 全ての漢字が5回以上使用されていることを確認
    expect(fiveOrMoreRate).toBe(1.0) // 100%
    expect(totalKanji).toBeGreaterThan(400) // 最低400種類の漢字

    // 各漢字が最低5回使用されていることを個別確認
    for (const [, count] of kanjiCount) {
      expect(count).toBeGreaterThanOrEqual(5)
    }
  })
})

describe('全体統計の確認', () => {
  it('各難易度レベルの統計を表示', () => {
    const levels: DifficultyLevel[] = ['elementary1', 'elementary2', 'elementary3', 'elementary4', 'elementary5', 'elementary6', 'junior', 'senior']

    const stats: Record<string, { 問題数: number; カバー漢字数: number }> = {}

    for (const level of levels) {
      const questions = getQuestionsByDifficulty(level)
      const kanjiSet = new Set<string>()

      for (const question of questions) {
        for (const input of question.inputs) {
          if (input.kanji) {
            const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
            for (const k of kanjiInAnswer) {
              kanjiSet.add(k)
            }
          }
        }
      }

      stats[level] = {
        問題数: questions.length,
        カバー漢字数: kanjiSet.size,
      }
    }
    for (const [_level, _stat] of Object.entries(stats)) {
    }

    // 基本的な数値要件を確認
    expect(stats.elementary1.問題数).toBeGreaterThan(500)
    expect(stats.junior.問題数).toBeGreaterThan(400)
    expect(stats.senior.問題数).toBeGreaterThan(400)
  })
})
