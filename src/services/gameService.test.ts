import { describe, expect, it } from 'vitest'

import type { Answer, Question } from '../atoms/gameAtoms'
import { checkAnswer, generateQuestions, getWrongKanjis, shouldStartPracticeMode } from './gameService'

describe('gameService', () => {
  describe('generateQuestions', () => {
    it('指定した数の問題を生成する', () => {
      const questions = generateQuestions(1, 10)
      expect(questions).toHaveLength(10)
    })

    it('各問題に必要なプロパティが含まれている', () => {
      const questions = generateQuestions(1, 1)
      const question = questions[0]

      expect(question).toHaveProperty('id')
      expect(question).toHaveProperty('sentence')
      expect(question).toHaveProperty('answer')
      expect(question).toHaveProperty('grade')
      expect(question).toHaveProperty('hint')
      expect(question.sentence).toMatch(/〔\s+〕/)
    })

    it('問題がランダムに選ばれる', () => {
      const questions1 = generateQuestions(1, 5)

      // 答えの順序が同じかチェック（完全に同じ順序になる確率は低い）
      const answers1 = questions1.map((q) => q.answer).join('')

      // 数回試してみて、少なくとも1回は異なることを確認
      let isDifferent = false
      for (let i = 0; i < 10; i++) {
        const testQuestions = generateQuestions(1, 5)
        const testAnswers = testQuestions.map((q) => q.answer).join('')
        if (testAnswers !== answers1) {
          isDifferent = true
          break
        }
      }

      expect(isDifferent).toBe(true)
    })

    it('同じ問題が重複しない', () => {
      const questions = generateQuestions(1, 10)
      const ids = questions.map((q) => q.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('checkAnswer', () => {
    const mockQuestion: Question = {
      id: 'test-1',
      sentence: '□きな犬',
      answer: '大',
      grade: 1,
      hint: 'おおきな',
    }

    it('正解の場合はtrueを返す', () => {
      const result = checkAnswer(mockQuestion, '大')
      expect(result).toBe(true)
    })

    it('不正解の場合はfalseを返す', () => {
      const result = checkAnswer(mockQuestion, '小')
      expect(result).toBe(false)
    })

    it('空文字の場合はfalseを返す', () => {
      const result = checkAnswer(mockQuestion, '')
      expect(result).toBe(false)
    })
  })

  describe('getWrongKanjis', () => {
    const mockQuestions: Question[] = [
      {
        id: 'q1',
        sentence: '□きな犬',
        answer: '大',
        grade: 1,
        hint: 'おおきな',
      },
      {
        id: 'q2',
        sentence: '□さな花',
        answer: '小',
        grade: 1,
        hint: 'ちいさな',
      },
      {
        id: 'q3',
        sentence: '□学生',
        answer: '中',
        grade: 1,
        hint: 'ちゅうがくせい',
      },
    ]

    const mockAnswers: Answer[] = [
      {
        questionId: 'q1',
        userAnswer: '大',
        isCorrect: true,
        timestamp: Date.now(),
      },
      {
        questionId: 'q2',
        userAnswer: '大',
        isCorrect: false,
        timestamp: Date.now(),
      },
      {
        questionId: 'q3',
        userAnswer: '大',
        isCorrect: false,
        timestamp: Date.now(),
      },
    ]

    it('間違えた漢字のリストを返す', () => {
      const wrongKanjis = getWrongKanjis(mockQuestions, mockAnswers)
      expect(wrongKanjis).toEqual(['小', '中'])
    })

    it('重複した間違いは1つにまとめる', () => {
      const duplicateAnswers: Answer[] = [
        ...mockAnswers,
        {
          questionId: 'q2',
          userAnswer: '大',
          isCorrect: false,
          timestamp: Date.now(),
        },
      ]

      const wrongKanjis = getWrongKanjis(mockQuestions, duplicateAnswers)
      expect(wrongKanjis).toEqual(['小', '中'])
    })
  })

  describe('shouldStartPracticeMode', () => {
    it('10問終了後に間違いがある場合はtrueを返す', () => {
      const mockAnswers: Answer[] = Array(10)
        .fill(null)
        .map((_, i) => ({
          questionId: `q${i}`,
          userAnswer: '大',
          isCorrect: i < 8, // 8問正解、2問不正解
          timestamp: Date.now(),
        }))

      const result = shouldStartPracticeMode(mockAnswers)
      expect(result).toBe(true)
    })

    it('10問全問正解の場合はfalseを返す', () => {
      const mockAnswers: Answer[] = Array(10)
        .fill(null)
        .map((_, i) => ({
          questionId: `q${i}`,
          userAnswer: '大',
          isCorrect: true,
          timestamp: Date.now(),
        }))

      const result = shouldStartPracticeMode(mockAnswers)
      expect(result).toBe(false)
    })

    it('10問未満の場合はfalseを返す', () => {
      const mockAnswers: Answer[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          questionId: `q${i}`,
          userAnswer: '大',
          isCorrect: false,
          timestamp: Date.now(),
        }))

      const result = shouldStartPracticeMode(mockAnswers)
      expect(result).toBe(false)
    })
  })
})
