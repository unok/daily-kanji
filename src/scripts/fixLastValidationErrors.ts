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

// 残りの漢字重複の修正（正確なID確認済み）
const lastKanjiDuplicationFixes: Record<string, string> = {
  // Elementary3
  'e3-1261': '新聞[記|き]事を読んで時事問題を学びました。',

  // Elementary4
  'e4-527': 'コメディー映画を見て大[笑|わら]いしました。',

  // Elementary5
  'e5-947': '石油を[燃|ねん]料として使用しました。',

  // Elementary6（ID確認済み）
  'e6-765': '新しい物語を[創|そう]作する楽しさを知りました。',
  'e6-853': '[勤|きん]勉な態度で仕事に取り組みました。',
  'e6-1143': '重要な方針を[宣|せん]言する時が来ました。',
  'e6-1183': '[将|しょう]棋の対局を楽しんでいます。',
  'e6-926': '[幼|よう]稚園で子どもたちが元気に遊んでいます。',

  // Junior
  'jun-012': '血液の[循|じゅん]環について学習しました。',
  'jun-059': '数値を[較|かく]べてみました。',
  'jun-064': '洗濯物を[乾|かわ]かしました。',
  'jun-071': '深い[感|かん]動を覚えました。',
  'jun-120': '指揮者がタクトを[振|ふ]りました。',
}

// 残りの重複文章の修正（同一学年内）
const lastDuplicateSentenceFixes: Record<string, string> = {
  // Elementary4の重複（最初に出現するもの以外を修正）
  'e4-102': '朝から晩まで一生懸命[働|はたら]いています。',
  'e4-1213': '工場で一生懸命[働|はたら]いています。',
  'e4-1323': '救助[隊|たい]長に任命されました。',
  'e4-382': '植物から新しい[芽|め]が出ました。',
  'e4-421': '難しい[試|し]験を受けました。',
  'e4-1247': '大学入学[試|し]験を受けました。',
  'e4-742': '電気の[節|せつ]約を心がけています。',
}

function processFile(filePath: string): number {
  const data: QuestionsFile = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let modifiedCount = 0

  for (const question of data.questions) {
    let newSentence = question.sentence

    // 漢字重複の修正を最優先
    if (lastKanjiDuplicationFixes[question.id]) {
      newSentence = lastKanjiDuplicationFixes[question.id]
      modifiedCount++
    }
    // 文章重複の修正
    else if (lastDuplicateSentenceFixes[question.id]) {
      newSentence = lastDuplicateSentenceFixes[question.id]
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

// 全ファイルを処理
const patterns = [
  /questions-elementary3-part\d+\.json$/,
  /questions-elementary4-part\d+\.json$/,
  /questions-elementary5-part\d+\.json$/,
  /questions-elementary6-part\d+\.json$/,
  /questions-junior-part\d+\.json$/,
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

console.log(`\n合計 ${totalFixed} 個の問題を修正しました。`)
