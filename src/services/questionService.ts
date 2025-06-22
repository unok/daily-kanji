import questionsElementary from '../data/questions/questions-elementary.json'
import questionsElementary1 from '../data/questions/questions-elementary1.json'
import questionsElementary2 from '../data/questions/questions-elementary2.json'
import questionsElementary3 from '../data/questions/questions-elementary3.json'
import questionsElementary4 from '../data/questions/questions-elementary4.json'
import questionsElementary5 from '../data/questions/questions-elementary5.json'
import questionsElementary6 from '../data/questions/questions-elementary6.json'
import questionsJunior from '../data/questions/questions-junior.json'
import questionsSenior from '../data/questions/questions-senior.json'
import type { QuestionData } from '../types/question'
import { parseQuestion } from '../utils/questionParser'

export type DifficultyLevel = 'elementary' | 'junior' | 'senior' | 'elementary1' | 'elementary2' | 'elementary3' | 'elementary4' | 'elementary5' | 'elementary6'

interface QuestionSet {
  level: DifficultyLevel
  title: string
  description: string
  questions: Array<{
    id: string
    sentence: string
    category?: string
  }>
}

// 問題データのマップ
const questionSets: Record<string, QuestionSet> = {
  elementary: questionsElementary as QuestionSet,
  junior: questionsJunior as QuestionSet,
  senior: questionsSenior as QuestionSet,
  elementary1: questionsElementary1 as QuestionSet,
  elementary2: questionsElementary2 as QuestionSet,
  elementary3: questionsElementary3 as QuestionSet,
  elementary4: questionsElementary4 as QuestionSet,
  elementary5: questionsElementary5 as QuestionSet,
  elementary6: questionsElementary6 as QuestionSet,
}

/**
 * 指定された難易度の問題セットを取得
 */
export function getQuestionSet(difficulty: DifficultyLevel): QuestionSet {
  return questionSets[difficulty as string]
}

/**
 * 指定された難易度からランダムに問題を取得
 */
export function getRandomQuestion(difficulty: DifficultyLevel): QuestionData {
  const questionSet = questionSets[difficulty as string]
  const randomIndex = Math.floor(Math.random() * questionSet.questions.length)
  const rawQuestion = questionSet.questions[randomIndex]

  // パースして完全なQuestionDataに変換
  const parsed = parseQuestion(rawQuestion.sentence)

  return {
    id: rawQuestion.id,
    originalSentence: rawQuestion.sentence,
    displaySentence: parsed.displaySentence,
    inputs: parsed.inputs,
    difficulty,
    category: rawQuestion.category || '',
  }
}

/**
 * 全難易度の問題数を取得
 */
export function getQuestionCounts(): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const [key, set] of Object.entries(questionSets)) {
    counts[key] = set.questions.length
  }
  return counts
}

/**
 * 指定されたIDの問題を取得
 */
export function getQuestionById(id: string): QuestionData | null {
  for (const [difficulty, questionSet] of Object.entries(questionSets)) {
    const question = questionSet.questions.find((q) => q.id === id)
    if (question) {
      const parsed = parseQuestion(question.sentence)
      return {
        id: question.id,
        originalSentence: question.sentence,
        displaySentence: parsed.displaySentence,
        inputs: parsed.inputs,
        difficulty: difficulty as DifficultyLevel,
        category: question.category || '',
      }
    }
  }
  return null
}

/**
 * カテゴリー一覧を取得
 */
export function getCategories(difficulty?: DifficultyLevel): string[] {
  const categories = new Set<string>()

  if (difficulty) {
    const set = questionSets[difficulty as string]
    if (set) {
      for (const q of set.questions) {
        categories.add(q.category || '')
      }
    }
  } else {
    for (const set of Object.values(questionSets)) {
      for (const q of set.questions) {
        categories.add(q.category || '')
      }
    }
  }

  return Array.from(categories).sort()
}

/**
 * 特定のカテゴリーの問題を取得
 */
export function getQuestionsByCategory(category: string, difficulty?: DifficultyLevel): QuestionData[] {
  const questions: QuestionData[] = []

  const processQuestionSet = (set: QuestionSet, level: DifficultyLevel) => {
    for (const q of set.questions) {
      if (q.category === category) {
        const parsed = parseQuestion(q.sentence)
        questions.push({
          id: q.id,
          originalSentence: q.sentence,
          displaySentence: parsed.displaySentence,
          inputs: parsed.inputs,
          difficulty: level,
          category: q.category || '',
        })
      }
    }
  }

  if (difficulty) {
    const set = questionSets[difficulty as string]
    if (set) {
      processQuestionSet(set, difficulty)
    }
  } else {
    for (const [level, set] of Object.entries(questionSets)) {
      processQuestionSet(set, level as DifficultyLevel)
    }
  }

  return questions
}

/**
 * 指定された難易度の問題を取得
 */
export function getQuestionsByDifficulty(difficulty: DifficultyLevel): QuestionData[] {
  const questionSet = questionSets[difficulty as string]
  if (!questionSet) return []

  return questionSet.questions.map((q) => {
    const parsed = parseQuestion(q.sentence)
    return {
      id: q.id,
      originalSentence: q.sentence,
      displaySentence: parsed.displaySentence,
      inputs: parsed.inputs,
      difficulty,
      category: q.category || '',
    }
  })
}
