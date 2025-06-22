#!/usr/bin/env tsx

import { readFileSync } from 'node:fs'

import { getKanjiByGrade } from '../data/kanji-lists/education-kanji'
import { parseQuestion } from '../utils/questionParser'

// 特定学年の不足漢字を詳細分析
function analyzeGrade(grade: number) {
  const filePath = `/home/unok/git/daily-kanji/daily-kanji/src/data/questions/questions-elementary${grade}.json`
  const data = JSON.parse(readFileSync(filePath, 'utf8'))
  const kanjiCount = new Map<string, number>()

  for (const question of data.questions) {
    const parsed = parseQuestion(question.sentence)
    for (const input of parsed.inputs) {
      if (input.kanji) {
        const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
        for (const k of kanjiInAnswer) {
          kanjiCount.set(k, (kanjiCount.get(k) || 0) + 1)
        }
      }
    }
  }

  const targetKanji = getKanjiByGrade(grade)
  const underrepresented: { kanji: string; count: number; needed: number }[] = []

  for (const kanji of targetKanji) {
    const count = kanjiCount.get(kanji) || 0
    if (count < 5) {
      underrepresented.push({ kanji, count, needed: 5 - count })
    }
  }

  console.log(`小学${grade}年生の分析結果:`)
  console.log(`総問題数: ${data.questions.length}`)
  console.log(`対象漢字数: ${targetKanji.length}`)
  console.log(`5回未満の漢字: ${underrepresented.length}個`)
  console.log('')

  console.log('不足している漢字（上位30個）:')
  underrepresented
    .sort((a, b) => a.count - b.count)
    .slice(0, 30)
    .forEach((item) => {
      console.log(`  ${item.kanji}: ${item.count}回 (${item.needed}回不足)`)
    })

  return underrepresented
}

// 小学1年生を分析
const grade = Number.parseInt(process.argv[2]) || 1
analyzeGrade(grade)
