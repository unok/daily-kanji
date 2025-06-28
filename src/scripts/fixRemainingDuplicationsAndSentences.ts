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

// 残りの漢字重複の修正
const remainingKanjiDuplicationFixes: Record<string, string> = {
  // Elementary4
  'e4-1328': '[鹿|しか]島神宮でお守りを買いました。',

  // Elementary6
  'e6-1262': '映画館の[座|ざ]席を予約しました。',
  'e6-982': '行方不明者の[探|たん]索活動に参加しました。',
  'e6-1106': '精巧な[模|も]型を作る技術を習得しました。',
  'e6-1267': '新記録を[樹|じゅ]立することができました。',
  'e6-1286': '過度な[欲|よく]望は身を滅ぼすことがあります。',
}

// 重複している文章の修正
const duplicateSentenceFixes: Record<string, string> = {
  // Elementary4
  'e4-742': '電気を[節|せつ]約する習慣を身につけました。',
  'e4-102': '朝から晩まで一生懸命[働|はたら]いています。',
  'e4-1213': '工場で一生懸命[働|はたら]いています。',
  'e4-1323': '救助[隊|たい]の隊長に任命されました。',
  'e4-382': '植物から新しい[芽|め]が出てきました。',
  'e4-421': '難しい[試|し]験問題を解きました。',
  'e4-1247': '大学入学[試|し]験の準備をしています。',
}

// ファイル処理関数
function processFile(filePath: string): number {
  const data: QuestionsFile = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let modifiedCount = 0

  for (const question of data.questions) {
    let newSentence = question.sentence

    // 漢字重複の修正
    if (remainingKanjiDuplicationFixes[question.id]) {
      newSentence = remainingKanjiDuplicationFixes[question.id]
      modifiedCount++
    }
    // 文章重複の修正
    else if (duplicateSentenceFixes[question.id]) {
      newSentence = duplicateSentenceFixes[question.id]
      modifiedCount++
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

// IDを探すためのヘルパー関数
function findProblemIds() {
  const patterns = [/questions-elementary4-part\d+\.json$/, /questions-elementary6-part\d+\.json$/]

  const problemSentences = ['映画館の座[座|ざ]を予約', '行方不明者の探[探|たん]活動', '精巧な模[模|も]を作る', '新記録を樹[樹|じゅ]する', '過度な欲[欲|よく]は']

  for (const pattern of patterns) {
    const files = fs
      .readdirSync(questionsDir)
      .filter((file) => pattern.test(file))
      .sort()

    for (const file of files) {
      const filePath = path.join(questionsDir, file)
      const data: QuestionsFile = JSON.parse(fs.readFileSync(filePath, 'utf8'))

      for (const question of data.questions) {
        for (const problemSentence of problemSentences) {
          if (question.sentence.includes(problemSentence)) {
            console.log(`Found: ${question.id} - ${question.sentence}`)
          }
        }
      }
    }
  }
}

// まずIDを探す
console.log('問題のあるIDを検索中...')
findProblemIds()

// 全ファイルを処理
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

console.log(`\n合計 ${totalFixed} 個の問題を修正しました。`)
