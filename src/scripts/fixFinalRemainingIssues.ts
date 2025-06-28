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
const remainingShortFixes: Record<string, string> = {
  'e6-742': '[優|ゆう]しい心を持つことが大切です。',
  'e6-771': '感動的な演[劇|げき]を鑑賞しました。',
  'e6-790': '税金を[収|しゅう]納する義務があります。',
  'e6-886': '人間の[尊|そん]厳を守ることが重要です。',
  'e6-903': '美術[展|てん]覧会を見に行きました。',
  'e6-927': '[幼|よう]児の教育について学びました。',
  'e6-950': '大切なことを[忘|わす]れないようにメモしました。',
  'e6-958': '[憲|けん]法について詳しく学習しました。',
  'e6-966': '建設的な[批|ひ]判をすることが大切です。',
  'e6-978': '事業を[拡|かく]大する計画を立てました。',
  'e6-1026': '木の切り[株|かぶ]から新芽が出ました。',
}

// 残りの漢字重複の修正
const remainingDuplicationFixes: Record<string, string> = {
  // Elementary3
  'e3-1261': '新聞[記|き]事を読んで時事問題を学びました。',

  // Elementary4
  'e4-527': 'コメディー映画を見て大[笑|わら]いしました。',

  // Elementary5
  'e5-947': '石油を[燃|ねん]料として使用しました。',

  // Elementary6
  'e6-341': '[暖|だん]房器具で部屋を温めました。',
  'e6-742': '[優|ゆう]しい心を持つことが大切です。',
  'e6-163': '新しい物語を[創|そう]作しました。',
  'e6-763': '[勤|きん]勉に働く姿勢を持ちました。',
  'e6-983': '重要な方針を[宣|せん]言しました。',
  'e6-973': '山の頂上まで探[索|さく]しました。',
  'e6-1183': '[将|しょう]来の夢について語りました。',
  'e6-1325': '新しい計画を[創|そう]造しました。',
  'e6-1327': '[親|しん]切な対応に感謝しました。',
  'e6-1330': '[私|し]的な意見を述べました。',
  'e6-1339': '[老|ろう]後の生活を考えました。',
  'e6-1348': '[観|かん]光地を訪れました。',
  'e6-1350': '[注|ちゅう]意深く話を聞きました。',
  'e6-1352': '[針|はり]仕事を丁寧に行いました。',

  // Junior
  'jun-012': '血液の[循|じゅん]環について学習しました。',
  'jun-059': '数値を[較|かく]べてみました。',
  'jun-064': '洗濯物を[乾|かわ]かしました。',
  'jun-071': '深い[感|かん]動を覚えました。',
  'jun-120': '指揮者がタクトを[振|ふ]りました。',
}

// 残りの重複文章の修正
const remainingDuplicateSentences: Record<string, string> = {
  // Elementary4の残りの重複
  'e4-742': '電気の[節|せつ]約を心がけています。',
  'e4-102': '毎日一生懸命[働|はたら]いています。',
  'e4-1323': '救助[隊|たい]長に任命されました。',
  'e4-382': '春になって新しい[芽|め]が出ました。',
  'e4-1247': '大学入学[試|し]験を受けました。',
}

function processFile(filePath: string): number {
  const data: QuestionsFile = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let modifiedCount = 0

  for (const question of data.questions) {
    let newSentence = question.sentence

    // 短い文章の修正を最優先
    if (remainingShortFixes[question.id]) {
      newSentence = remainingShortFixes[question.id]
      modifiedCount++
    }
    // 漢字重複の修正
    else if (remainingDuplicationFixes[question.id]) {
      newSentence = remainingDuplicationFixes[question.id]
      modifiedCount++
    }
    // 文章重複の修正
    else if (remainingDuplicateSentences[question.id]) {
      newSentence = remainingDuplicateSentences[question.id]
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
