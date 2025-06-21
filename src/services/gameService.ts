import type { Answer, Question } from '../atoms/gameAtoms'
import kanjiGrade1Data from '../data/kanji-grade1-complete.json'

export function generateQuestions(_grade: number, count: number): Question[] {
  // 現在は1年生の漢字のみ対応
  const kanjiData = kanjiGrade1Data

  const questions: Question[] = []
  const usedIndices = new Set<number>()

  // ランダムに問題を選択
  while (questions.length < count && usedIndices.size < kanjiData.kanji.length) {
    const kanjiIndex = Math.floor(Math.random() * kanjiData.kanji.length)

    if (usedIndices.has(kanjiIndex)) continue
    usedIndices.add(kanjiIndex)

    const kanji = kanjiData.kanji[kanjiIndex]
    const exampleIndex = Math.floor(Math.random() * kanji.examples.length)
    const example = kanji.examples[exampleIndex]

    questions.push({
      id: `q-${Date.now()}-${questions.length}`,
      sentence: example.sentence,
      answer: example.answer,
      grade: kanjiData.grade,
      hint: example.hint,
    })
  }

  return questions
}

export function checkAnswer(question: Question, userAnswer: string): boolean {
  return question.answer === userAnswer
}

export function getWrongKanjis(questions: Question[], answers: Answer[]): string[] {
  const wrongKanjis = new Set<string>()

  for (const answer of answers) {
    if (!answer.isCorrect) {
      const question = questions.find((q) => q.id === answer.questionId)
      if (question) {
        wrongKanjis.add(question.answer)
      }
    }
  }

  return Array.from(wrongKanjis)
}

export function shouldStartPracticeMode(answers: Answer[]): boolean {
  if (answers.length !== 10) {
    return false
  }

  return answers.some((answer) => !answer.isCorrect)
}
