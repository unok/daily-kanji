import questionsElementary from '../data/questions-elementary.json'
import questionsJunior from '../data/questions-junior.json'
import questionsSenior from '../data/questions-senior.json'
import type { QuestionData } from '../types/question'
import { parseQuestion } from '../utils/questionParser'

export type DifficultyLevel = 'elementary' | 'junior' | 'senior'

interface QuestionSet {
  level: DifficultyLevel
  title: string
  description: string
  questions: Array<{
    id: string
    sentence: string
    category: string
    hint: string
  }>
}

// 問題データのマップ
const questionSets: Record<DifficultyLevel, QuestionSet> = {
  elementary: questionsElementary as QuestionSet,
  junior: questionsJunior as QuestionSet,
  senior: questionsSenior as QuestionSet,
}

/**
 * 指定された難易度の問題セットを取得
 */
export function getQuestionSet(difficulty: DifficultyLevel): QuestionSet {
  return questionSets[difficulty]
}

/**
 * 指定された難易度からランダムに問題を取得
 */
export function getRandomQuestion(difficulty: DifficultyLevel): QuestionData {
  const questionSet = questionSets[difficulty]
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
    hint: rawQuestion.hint,
    category: rawQuestion.category,
  }
}

/**
 * 全難易度の問題数を取得
 */
export function getQuestionCounts(): Record<DifficultyLevel, number> {
  return {
    elementary: questionSets.elementary.questions.length,
    junior: questionSets.junior.questions.length,
    senior: questionSets.senior.questions.length,
  }
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
        hint: question.hint,
        category: question.category,
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
    for (const q of questionSets[difficulty].questions) {
      categories.add(q.category)
    }
  } else {
    for (const set of Object.values(questionSets)) {
      for (const q of set.questions) {
        categories.add(q.category)
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
          hint: q.hint,
          category: q.category,
        })
      }
    }
  }

  if (difficulty) {
    processQuestionSet(questionSets[difficulty], difficulty)
  } else {
    for (const [level, set] of Object.entries(questionSets)) {
      processQuestionSet(set, level as DifficultyLevel)
    }
  }

  return questions
}
