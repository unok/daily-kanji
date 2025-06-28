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

// Fix kanji duplication issues
const kanjiDuplicationFixes: Record<string, string> = {
  // Elementary4 - 隊が重複 (e4-1323)
  'e4-1323': '救助[隊|たい]の副隊長として任命されました。',

  // Elementary6 - 激が重複 (e6-1082 has 激激)
  'e6-1082': '不正に対して[激|げき]怒する気持ちも理解できます。',
}

// Fix specific duplicate sentences found in validation
const duplicateSentenceFixes: Record<string, string> = {
  // 節電を心がけます - e4-143, e4-667
  'e4-667': '家計の[節|せつ]約を心がけています。',

  // 一生懸命働きました - e4-10017, e4-172
  'e4-10017': '新しい職場で一生懸命[働|はたら]いています。',

  // 隊長に任命されました - e4-013-003, e4-189
  'e4-189': '消防[隊|たい]の隊長として選ばれました。',

  // 芽が出ました - e4-159, e4-492
  'e4-492': '植物の[芽|め]が春に伸びました。',

  // 試験を受けました - e4-168, e4-450
  'e4-450': '大学の入学[試|し]験を受けました。',
}

// Process a single file
function processFile(filePath: string): number {
  const data: QuestionsFile = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let modifiedCount = 0

  for (const question of data.questions) {
    let newSentence = question.sentence

    // Fix kanji duplications
    if (kanjiDuplicationFixes[question.id]) {
      newSentence = kanjiDuplicationFixes[question.id]
      modifiedCount++
      console.log(`  Fixed kanji duplication: ${question.id}`)
    }
    // Fix sentence duplications
    else if (duplicateSentenceFixes[question.id]) {
      newSentence = duplicateSentenceFixes[question.id]
      modifiedCount++
      console.log(`  Fixed sentence duplication: ${question.id}`)
    }

    if (newSentence !== question.sentence) {
      question.sentence = newSentence
    }
  }

  if (modifiedCount > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
  }

  return modifiedCount
}

console.log('🔧 修正中...')

// Process all files
const patterns = [/questions-elementary4-part\d+\.json$/, /questions-elementary6-part\d+\.json$/]

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

console.log(`\n✅ 合計 ${totalFixed} 個の問題を修正しました。`)
