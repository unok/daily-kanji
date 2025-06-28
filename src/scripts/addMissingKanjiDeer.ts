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

// 小学4年生の最後のファイルに鹿を追加
const pattern = /questions-elementary4-part\d+\.json$/
const files = fs
  .readdirSync(questionsDir)
  .filter((file) => pattern.test(file))
  .sort()

const lastFile = files[files.length - 1]
const filePath = path.join(questionsDir, lastFile)
const data: QuestionsFile = JSON.parse(fs.readFileSync(filePath, 'utf8'))

// 既存の最大IDを取得
let maxId = 0
for (const q of data.questions) {
  const match = q.id.match(/(\d+)$/)
  if (match) {
    const num = Number.parseInt(match[1])
    if (num > maxId) maxId = num
  }
}

// 鹿の問題を5個追加
const deerQuestions = [
  '[鹿|か]児島県の桜島を見ました。',
  '奈良公園で[鹿|しか]に餌をあげました。',
  '野生の[鹿|しか]が山から下りてきました。',
  '[鹿|か]の子模様の布を買いました。',
  '鹿[鹿|か]島神宮に参拝しました。',
]

for (const sentence of deerQuestions) {
  maxId++
  data.questions.push({
    id: `e4-${maxId}`,
    sentence: sentence,
  })
}

fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)

console.log(`✅ ${lastFile}: 鹿の問題を5個追加しました。`)
