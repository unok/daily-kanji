import { getQuestionsByDifficulty } from '../services/questionService'
import type { QuestionInput } from '../types/question'

// 実際の問題データから使用されている漢字を分析
function analyzeActualKanji() {
  // 中学校の漢字分析
  const juniorQuestions = getQuestionsByDifficulty('junior')
  const juniorKanjiCount = new Map<string, number>()
  const juniorKanjiSet = new Set<string>()

  juniorQuestions.forEach((question) => {
    question.inputs.forEach((input: QuestionInput) => {
      if (input.kanji) {
        const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
        kanjiInAnswer.forEach((k) => {
          juniorKanjiCount.set(k, (juniorKanjiCount.get(k) || 0) + 1)
          juniorKanjiSet.add(k)
        })
      }
    })
  })

  // 出現回数順でソート
  const juniorSorted = Array.from(juniorKanjiCount.entries()).sort((a, b) => b[1] - a[1])
  juniorSorted.slice(0, 30).forEach(([_kanji, _count]) => {})

  // 高校の漢字分析
  const seniorQuestions = getQuestionsByDifficulty('senior')
  const seniorKanjiCount = new Map<string, number>()
  const seniorKanjiSet = new Set<string>()

  seniorQuestions.forEach((question) => {
    question.inputs.forEach((input: QuestionInput) => {
      if (input.kanji) {
        const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
        kanjiInAnswer.forEach((k) => {
          seniorKanjiCount.set(k, (seniorKanjiCount.get(k) || 0) + 1)
          seniorKanjiSet.add(k)
        })
      }
    })
  })

  // 出現回数順でソート
  const seniorSorted = Array.from(seniorKanjiCount.entries()).sort((a, b) => b[1] - a[1])
  seniorSorted.slice(0, 30).forEach(([_kanji, _count]) => {})
  const _juniorKanjiList = juniorSorted.map(([kanji]) => kanji)
  const _seniorKanjiList = seniorSorted.map(([kanji]) => kanji)
}

analyzeActualKanji()
