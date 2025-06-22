import { EDUCATION_KANJI } from '../data/kanji-lists/education-kanji'
import { type DifficultyLevel, getQuestionsByDifficulty } from '../services/questionService'

// 各学年の漢字出現回数を分析
function analyzeKanjiCoverage() {
  const allKanjiCount = new Map<string, number>()
  const gradeKanjiUsage: Record<number, Map<string, number>> = {}

  // 各学年の分析
  for (let grade = 1; grade <= 6; grade++) {
    const questions = getQuestionsByDifficulty(`elementary${grade}` as DifficultyLevel)
    const kanjiCount = new Map<string, number>()

    for (const question of questions) {
      for (const input of question.inputs) {
        if (input.kanji) {
          const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
          for (const k of kanjiInAnswer) {
            kanjiCount.set(k, (kanjiCount.get(k) || 0) + 1)
            allKanjiCount.set(k, (allKanjiCount.get(k) || 0) + 1)
          }
        }
      }
    }

    gradeKanjiUsage[grade] = kanjiCount
  }

  for (let grade = 1; grade <= 6; grade++) {
    const targetKanji = EDUCATION_KANJI[grade as keyof typeof EDUCATION_KANJI]
    const usedKanji = gradeKanjiUsage[grade]

    const missingKanji: string[] = []
    const underrepresentedKanji: { kanji: string; count: number }[] = []

    for (const kanji of targetKanji) {
      const count = usedKanji.get(kanji) || 0
      if (count === 0) {
        missingKanji.push(kanji)
      } else if (count < 5) {
        underrepresentedKanji.push({ kanji, count })
      }
    }
    if (missingKanji.length > 0) {
    }
    if (underrepresentedKanji.length > 0) {
      // const _summary = underrepresentedKanji
      //   .sort((a, b) => a.count - b.count)
      //   .slice(0, 20)
      //   .map((item) => `${item.kanji}(${item.count}回)`)
      //   .join(', ')
    }
  }
  // const _totalUnderrepresented = Array.from(allKanjiCount.entries())
  //   .filter(([_, count]) => count < 5)
  //   .sort((a, b) => a[1] - b[1])
}

analyzeKanjiCoverage()
