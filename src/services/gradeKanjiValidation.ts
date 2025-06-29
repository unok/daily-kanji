import * as fs from 'node:fs'
import * as path from 'node:path'

import { KANJI_BY_GRADE } from '../data/kanjiByGrade'

type ValidationResult = {
  kanjiUsageStats: Record<string, Record<string, number>>
  duplicateKanjiErrors: Array<{
    questionId: string
    sentence: string
    kanjiChar: string
    grade: string
  }>
  duplicateSentences: Array<{
    sentence: string
    ids: string[]
    grade: string
  }>
  duplicateIds: Array<{
    id: string
    count: number
  }>
  shortSentences: Array<{
    id: string
    sentence: string
    length: number
    grade: string
  }>
}

export function validateKanjiUsageInQuestions(): ValidationResult {
  const result: ValidationResult = {
    kanjiUsageStats: {},
    duplicateKanjiErrors: [],
    duplicateSentences: [],
    duplicateIds: [],
    shortSentences: [],
  }

  // 各学年の漢字使用回数を初期化
  for (const grade of Object.keys(KANJI_BY_GRADE)) {
    result.kanjiUsageStats[grade] = {}
    for (const kanji of KANJI_BY_GRADE[grade]) {
      result.kanjiUsageStats[grade][kanji] = 0
    }
  }

  const questionsDir = path.join(process.cwd(), 'src/data/questions')
  const files = fs.readdirSync(questionsDir).filter((f) => f.endsWith('.json'))

  const sentenceMap = new Map<string, { ids: string[]; grade: string }>()
  const idCount = new Map<string, number>()

  for (const file of files) {
    const filePath = path.join(questionsDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(content)

    // ファイル名から学年を推定
    let grade = 'その他'
    if (file.includes('elementary1')) grade = '小学1年'
    else if (file.includes('elementary2')) grade = '小学2年'
    else if (file.includes('elementary3')) grade = '小学3年'
    else if (file.includes('elementary4')) grade = '小学4年'
    else if (file.includes('elementary5')) grade = '小学5年'
    else if (file.includes('elementary6')) grade = '小学6年'
    else if (file.includes('junior')) grade = '中学校'
    else if (file.includes('senior')) grade = '高校'

    for (const question of data.questions) {
      const { id, sentence } = question

      // ID重複チェック
      idCount.set(id, (idCount.get(id) || 0) + 1)

      // 文章の長さチェック
      const cleanSentence = sentence.replace(/\[([^|]+)\|[^\]]+\]/g, '$1')
      if (cleanSentence.length < 9) {
        result.shortSentences.push({
          id,
          sentence,
          length: cleanSentence.length,
          grade,
        })
      }

      // 文章重複チェック（同じ学年内のみ）
      const key = `${grade}:${sentence}`
      if (!sentenceMap.has(key)) {
        sentenceMap.set(key, { ids: [], grade })
      }
      sentenceMap.get(key)?.ids.push(id)

      // 入力漢字を抽出
      const inputMatches = [...sentence.matchAll(/\[([^|]+)\|[^\]]+\]/g)]
      const inputKanjiSet = new Set<string>()

      for (const match of inputMatches) {
        const kanjiPart = match[1]
        for (const char of kanjiPart) {
          inputKanjiSet.add(char)

          // 使用回数をカウント
          for (const [g, kanjiList] of Object.entries(KANJI_BY_GRADE)) {
            if (kanjiList.includes(char)) {
              result.kanjiUsageStats[g][char]++
            }
          }
        }
      }

      // 文章内の漢字をチェック（入力部分を除く）
      const sentenceWithoutInput = sentence.replace(/\[([^|]+)\|[^\]]+\]/g, '')

      for (const inputKanji of inputKanjiSet) {
        if (sentenceWithoutInput.includes(inputKanji)) {
          result.duplicateKanjiErrors.push({
            questionId: id,
            sentence,
            kanjiChar: inputKanji,
            grade,
          })
        }
      }
    }
  }

  // 重複文章を抽出
  for (const [key, data] of sentenceMap.entries()) {
    if (data.ids.length > 1) {
      const sentence = key.split(':').slice(1).join(':')
      result.duplicateSentences.push({
        sentence,
        ids: data.ids,
        grade: data.grade,
      })
    }
  }

  // 重複IDを抽出
  for (const [id, count] of idCount.entries()) {
    if (count > 1) {
      result.duplicateIds.push({ id, count })
    }
  }

  return result
}
