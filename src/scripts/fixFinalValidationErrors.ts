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
const kanjiDuplicationFixes: Record<string, string> = {
  // Elementary4
  'e4-1323': '救助[隊|たい]の副隊長に任命されました。',

  // Elementary6
  'e6-934': '映画館の[座|ざ]席を予約しました。',
  'e6-1034': '精巧な[模|も]型を作る技術を習得しました。',
  'e6-1043': '新記録を[樹|じゅ]立することができました。',
  'e6-1046': '過度な[欲|よく]望は身を滅ぼすことがあります。',
  'e6-1103': '不正に対して[激|げき]怒する気持ちも理解できます。',
}

// 重複している文章の修正
const duplicateSentenceFixes: Record<string, string> = {
  // Elementary3
  'e3-010-005': '新聞[記|き]者の仕事について学びました。',

  // Elementary4の重複
  'e4-742': '電気の[節|せつ]約を心がけています。',
  'e4-102': '朝から晩まで一生懸命[働|はたら]いています。',
  'e4-1213': '農場で一生懸命[働|はたら]いています。',
  'e4-157': '消防[隊|たい]長に任命されました。',
  'e4-133': '春になると新しい[芽|め]が出ます。',
}

// ファイル処理関数
function processFile(filePath: string): number {
  const data: QuestionsFile = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let modifiedCount = 0

  for (const question of data.questions) {
    let newSentence = question.sentence

    // 漢字重複の修正
    if (kanjiDuplicationFixes[question.id]) {
      newSentence = kanjiDuplicationFixes[question.id]
      modifiedCount++
      console.log(`  Fixed kanji duplication: ${question.id}`)
    }
    // 文章重複の修正
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

// まず問題のIDを検索
console.log('検証エラーで報告された問題を検索中...')

// 全ファイルを処理
const patterns = [/questions-elementary3-part\d+\.json$/, /questions-elementary4-part\d+\.json$/, /questions-elementary6-part\d+\.json$/]

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
