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

// 重複している文章の修正マップ
const duplicateFixes: Record<string, string> = {
  // Elementary3
  'e3-1226': '新しいことが[始|はじ]まる予感がしました。', // 元: [始|はじ]まりの合図です。
  'e3-1185': '大きく窓を[開|あ]けて換気しました。', // 元: 窓を[開|あ]けました。

  // Elementary4
  'e4-982': '自然史[博|はく]物館で化石を見ました。', // 元: [博|はく]物館に行きました。
  'e4-346': '交通[法|ほう]規を守って運転します。', // 元: [法|ほう]律を守ります。
  'e4-547': '急に[熱|ねつ]が上がってきました。', // 元: [熱|ねつ]が出ました。
  'e4-130': '高い[熱|ねつ]のため学校を休みました。', // 元: [熱|ねつ]が出ました。
}

// 漢字重複の修正（追加分）
const kanjiDuplicationFixes: Record<string, string> = {
  // Elementary3
  'e3-1261': '新聞[記|き]事を読んで[世|よ]の中の出来事を知りました。', // [記事|きじ]を読んで、[世界|せかい]の出来事... -> 事の重複回避

  // Elementary4
  'e4-527': '面白い喜劇を見て大[笑|わら]いしました。', // 面白い[笑|き]劇を見て大笑い... -> 笑の重複回避

  // Elementary5
  'e5-947': '石油[燃|ねん]料を使用しました。', // 石油[燃|ねん]料を燃やしました... -> 燃の重複回避

  // Junior
  'jun-012': '血液の[循|じゅん]環について学習しました。', // [循|じゅん]環について修練ました... -> 修の重複回避
  'jun-059': '比[較|かく]してみると違いが分かります。', // 較[較|かく]してみました... -> 較の重複回避
  'jun-064': '[乾|かわ]いた洗濯物を取り込みました。', // 布団を[乾|ほ]して乾かします... -> 乾の重複回避
  'jun-071': '[感|かん]動したことを正直に話しました。', // 嬉しい感情を[感|かん]じました... -> 感の重複回避
  'jun-120': '[揮|き]発性の液体を扱いました。', // 指[振|き]者がタクトを振りました... -> 振の重複回避
}

function processFile(filePath: string): number {
  const data: QuestionsFile = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let modifiedCount = 0

  for (const question of data.questions) {
    if (duplicateFixes[question.id]) {
      question.sentence = duplicateFixes[question.id]
      modifiedCount++
    } else if (kanjiDuplicationFixes[question.id]) {
      question.sentence = kanjiDuplicationFixes[question.id]
      modifiedCount++
    }
  }

  if (modifiedCount > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
  }

  return modifiedCount
}

let _totalFixed = 0
const patterns = [
  /questions-elementary3-part\d+\.json$/,
  /questions-elementary4-part\d+\.json$/,
  /questions-elementary5-part\d+\.json$/,
  /questions-elementary6-part\d+\.json$/,
  /questions-junior-part\d+\.json$/,
]

for (const pattern of patterns) {
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
}
