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

// 3つの入力欄がある問題の修正
const threeInputFixes: Record<string, string> = {
  'e6-142': '伝統的な[染|そ]め物の[姿|すがた]を見学しました。',
  'e6-147': '桑畑で[蚕|かいこ]の[観|かん]察をしました。',
}

// 短い文章の修正（9文字以上にする）
const shortSentenceFixes: Record<string, string> = {
  // 2文字の文
  'e6-1108': '精巧な[模|も]型を使って実験しました。',
  'e6-1228': '清らかな水の[源|みなもと]を探しました。',

  // 3文字の文（validation errorで報告されたもの）
  'e6-901': '[優|ゆう]しい気持ちで接しました。',
  'e6-902': '感動的な[劇|げき]を鑑賞しました。',
  'e6-1022': '税金を[納|のう]める義務があります。',
  'e6-1024': '人間の[厳|げん]格を尊重します。',
  'e6-1025': '[幼|おさな]い頃の思い出を大切にします。',

  // その他の主要な短い文
  'e6-103': '新聞に[刻|きざ]まれた記事を読みました。',
  'e6-123': '危険な[崖|がけ]から離れて歩きました。',
  'e6-143': '骨を[折|お]らないよう気をつけました。',
  'e6-146': '美しい[泉|いずみ]の水を汲みました。',
  'e6-341': '暖かい[暖|だん]房で過ごしました。',
  'e6-582': '[賃|ちん]金の交渉を行いました。',
  'e6-623': '大切な[宝|たから]物を見つけました。',
  'e6-663': '[忠|ちゅう]実な部下として働きました。',
  'e6-923': '誕生日を[祝|いわ]って楽しく過ごしました。',
  'e6-1023': '商品を[収|しゅう]納する倉庫を整理しました。',
  'e6-1142': '[処|しょ]理の方法を詳しく説明しました。',
  'e6-1182': '適切に[処|しょ]分する必要があります。',
  'e6-1223': '大切な[貴|き]重品を保管しました。',
  'e6-1242': '学校を[卒|そつ]業する日が近づきました。',
}

// 漢字重複の修正
const kanjiDuplicationFixes: Record<string, string> = {
  'e6-901': '[優|ゆう]しい気持ちで接しました。', // 優[優|ゆう] -> [優|ゆう]しい
  'e6-163': '物語を[創|そう]作する楽しさを知りました。', // 創[創|そう] -> [創|そう]作
  'e6-763': '[勤|きん]勉な態度で仕事に取り組みました。', // 勤[勤|きん] -> [勤|きん]勉
  'e6-983': '重要な決定を[宣|せん]言する時が来ました。', // 宣[宣|せん] -> [宣|せん]言
  'e6-1183': '[将|しょう]棋の対局を楽しんでいます。', // 将[将|しょう] -> [将|しょう]棋
}

function processFile(filePath: string): number {
  const data: QuestionsFile = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let modifiedCount = 0

  for (const question of data.questions) {
    let newSentence = question.sentence

    // 3入力欄の修正
    if (threeInputFixes[question.id]) {
      newSentence = threeInputFixes[question.id]
      modifiedCount++
    }
    // 短い文章の修正
    else if (shortSentenceFixes[question.id]) {
      newSentence = shortSentenceFixes[question.id]
      modifiedCount++
    }
    // 漢字重複の修正
    else if (kanjiDuplicationFixes[question.id]) {
      newSentence = kanjiDuplicationFixes[question.id]
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

let _totalFixed = 0
const pattern = /questions-elementary6-part\d+\.json$/

const files = fs
  .readdirSync(questionsDir)
  .filter((file) => pattern.test(file))
  .sort()

for (const file of files) {
  const filePath = path.join(questionsDir, file)
  const fixed = processFile(filePath)
  if (fixed > 0) {
    _totalFixed += fixed
  }
}
