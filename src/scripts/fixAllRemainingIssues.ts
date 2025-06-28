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

// 小学6年生の短い文章の修正
const elementary6ShortFixes: Record<string, string> = {
  'e6-901': '親切で[優|ゆう]しい人に出会いました。',
  'e6-902': '感動的な[劇|げき]を観賞しました。',
  'e6-1023': '商品を[収|しゅう]納する倉庫を整理しました。',
  'e6-1024': '人間の[尊|そん]厳を大切にします。',
  'e6-1025': '[幼|おさな]い頃の思い出を大切にします。',
  'e6-1031': '彼女の美しい[姿|すがた]を見ました。',
  'e6-1033': '建物の[模|も]型を作成しました。',
  'e6-1142': '[処|しょ]理の方法を詳しく説明しました。',
  'e6-1228': '清らかな水の[源|みなもと]を探しました。',
}

// 漢字重複の修正
const kanjiDuplicationFixes: Record<string, string> = {
  // Elementary3
  'e3-1261': '新聞[記|き]事を読んで時事問題を学びました。',

  // Elementary4
  'e4-527': 'コメディー映画を見て大[笑|わら]いしました。',

  // Elementary5
  'e5-947': '石油を[燃|ねん]料として使用しました。',

  // Elementary6
  'e6-341': '[暖|だん]房器具で部屋を暖めました。',
  'e6-901': '親切で[優|ゆう]しい人に出会いました。',
  'e6-163': '新しい物語を[創|そう]作しました。',
  'e6-763': '[勤|きん]勉に働く姿勢を持ちました。',
  'e6-983': '重要な方針を[宣|せん]言しました。',
  'e6-1183': '[将|しょう]来の夢について語りました。',
  'e6-1325': '新しい計画を[創|そう]造しました。',
  'e6-1327': '親が[親|おや]切に教えてくれました。',
  'e6-1330': '私が[私|わたくし]的な意見を述べました。',
  'e6-1339': '老いて[老|ろう]後を考えました。',
  'e6-1348': '[観|かん]光地を訪れて観察しました。',
  'e6-1350': '注意を[注|ちゅう]意深く聞きました。',
  'e6-1352': '針で[針|はり]仕事をしました。',

  // Junior
  'jun-012': '血液の[循|じゅん]環について学習しました。',
  'jun-059': '数値を[較|かく]べてみました。',
  'jun-064': '洗濯物を[乾|かわ]かしました。',
  'jun-071': '深い[感|かん]動を覚えました。',
  'jun-120': '指揮者がタクトを[振|ふ]りました。',
}

// 同一学年内の重複文章の修正
const duplicateSentenceFixes: Record<string, string> = {
  // Fix kanji duplication - both 隊 problems
  'e4-189': '消防[隊|たい]の責任者として選ばれました。',
  'e4-1323': '救助[隊|たい]の副責任者として任命されました。',

  // Fix remaining sentence duplications found in validation report
  // [説|せつ]明を聞きました
  'e4-938': '詳しい[説|せつ]明を理解しました。',

  // [課|か]題を提出しました
  'e4-940': '宿題の[課|か]題を完成させました。',

  // [貨|か]物を運びました
  'e4-273': '重い[貨|か]物を配送しました。',

  // [辞|じ]書を引きました
  'e4-829': '国語の[辞|じ]書で調べました。',

  // [録|ろく]音しました
  'e4-1075': '音楽を[録|ろく]音して保存しました。',
}

function processFile(filePath: string): number {
  const data: QuestionsFile = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let modifiedCount = 0

  for (const question of data.questions) {
    let newSentence = question.sentence

    // 短い文章の修正を最優先
    if (elementary6ShortFixes[question.id]) {
      newSentence = elementary6ShortFixes[question.id]
      modifiedCount++
    }
    // 漢字重複の修正
    else if (kanjiDuplicationFixes[question.id]) {
      newSentence = kanjiDuplicationFixes[question.id]
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
