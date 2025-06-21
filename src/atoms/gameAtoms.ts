import { atom } from 'jotai'

export interface Question {
  id: string
  sentence: string
  answer: string
  grade: number
  hint?: string
}

export interface Answer {
  questionId: string
  userAnswer: string
  isCorrect: boolean
  timestamp: number
}

export interface PracticeSession {
  kanji: string
  count: number
}

// 問題関連のatoms
export const questionsAtom = atom<Question[]>([])
export const currentQuestionIndexAtom = atom<number>(0)
export const answersAtom = atom<Answer[]>([])

// 現在の問題を取得するatom
export const currentQuestionAtom = atom((get) => {
  const questions = get(questionsAtom)
  const index = get(currentQuestionIndexAtom)
  return questions[index] || null
})

// 練習モード関連のatoms
export const isPracticeModeAtom = atom<boolean>(false)
export const practiceSessionAtom = atom<PracticeSession | null>(null)
export const practiceCountAtom = atom<number>(0)

// ゲーム状態
export const gameStateAtom = atom<'menu' | 'playing' | 'practice' | 'result' | 'fillblank'>('menu')

// 間違えた漢字のリスト
export const incorrectKanjisAtom = atom((get) => {
  const answers = get(answersAtom)
  return answers
    .filter((answer) => !answer.isCorrect)
    .map((answer) => {
      const question = get(questionsAtom).find((q) => q.id === answer.questionId)
      return question?.answer || ''
    })
    .filter((kanji) => kanji !== '')
})
