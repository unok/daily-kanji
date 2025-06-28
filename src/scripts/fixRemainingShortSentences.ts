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

// 残りの短い文章の修正
const shortSentenceFixes: Record<string, string> = {
  // elementary6-part7の残り
  'e6-1031': '彼女の美しい[姿|すがた]を見ました。',
  'e6-1033': '建物の[模|も]型を作成しました。',
  'e6-1072': '川の[源|みなもと]を探検しました。',
  'e6-1078': '海水で顔を[洗|あら]いました。',
  'e6-1079': '満[潮|ちょう]時に釣りをしました。',
  'e6-1086': '果実が[熟|じゅく]すのを待ちました。',
  'e6-1093': '[胸|むね]が痛くなりました。',
  'e6-1096': '[胸|きょう]囲を測定しました。',
  'e6-1102': '民[衆|しゅう]の声を聞きました。',
  'e6-1103': '大[衆|たいしゅう]文化について学びました。',
  'e6-1104': '群[衆|ぐんしゅう]が集まってきました。',
}

function processFile(filePath: string): number {
  const data: QuestionsFile = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let modifiedCount = 0

  for (const question of data.questions) {
    if (shortSentenceFixes[question.id]) {
      question.sentence = shortSentenceFixes[question.id]
      modifiedCount++
    }
  }

  if (modifiedCount > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
  }

  return modifiedCount
}

let _totalFixed = 0
const files = fs
  .readdirSync(questionsDir)
  .filter((file) => file.match(/questions-elementary6-part\d+\.json$/))
  .sort()

for (const file of files) {
  const filePath = path.join(questionsDir, file)
  const fixed = processFile(filePath)
  if (fixed > 0) {
    _totalFixed += fixed
  }
}
