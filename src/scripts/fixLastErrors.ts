#!/usr/bin/env tsx

import * as fs from 'node:fs'
import * as path from 'node:path'

const questionsDir = path.join(process.cwd(), 'src/data/questions')

interface Question {
  id: string
  sentence: string
}

interface QuestionsFile {
  questions: Question[]
}

// Fix the last remaining issues
const finalFixes: Record<string, string> = {
  // Fix kanji duplication in elementary6
  'e6-341': '[暖|だん]房設備で部屋を温めました。',

  // Fix remaining sentence duplications from validation report
  // [満|まん]足しました
  'e4-249': '結果に[満|まん]足して喜びました。',
  
  // [訓|くん]練を受けました  
  'e4-707': '厳しい[訓|くん]練に参加しました。',
  
  // [選|せん]手になりました
  'e4-969': 'チームの[選|せん]手として活躍しました。',
  
  // [飛|ひ]行機に乗りました (fix two of the three)
  'e4-350': '国際[飛|ひ]行便に搭乗しました。',
  'e4-403': '小型[飛|ひ]行機で旅行しました。',
  
  // 商店[街|がい]を歩きました (fix two of the three)
  'e4-550': '古い商店[街|がい]を散策しました。',
  'e4-983': '新しい商店[街|がい]で買い物しました。',
}

function processFile(filePath: string): number {
  const data: QuestionsFile = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let modifiedCount = 0

  for (const question of data.questions) {
    if (finalFixes[question.id]) {
      const oldSentence = question.sentence
      question.sentence = finalFixes[question.id]
      modifiedCount++
      console.log(`  Fixed ${question.id}: "${oldSentence}" → "${question.sentence}"`)
    }
  }

  if (modifiedCount > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
  }

  return modifiedCount
}

console.log('🔧 最後の修正を実行中...')

// Process all elementary files
const patterns = [
  /questions-elementary4-part\d+\.json$/,
  /questions-elementary6-part\d+\.json$/,
]

let totalFixed = 0

for (const pattern of patterns) {
  const files = fs
    .readdirSync(questionsDir)
    .filter((file) => pattern.test(file))
    .sort()

  for (const file of files) {
    const filePath = path.join(questionsDir, file)
    const fixed = processFile(filePath)
    if (fixed > 0) {
      console.log(`✅ ${file}: ${fixed}個の問題を修正`)
      totalFixed += fixed
    }
  }
}

console.log(`\n✅ 最後の修正完了: ${totalFixed} 個の問題を修正しました。`)