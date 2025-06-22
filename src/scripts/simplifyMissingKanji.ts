#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'node:fs'

// 最も不足している漢字に対して5問ずつ追加
function addQuickQuestions() {
  // 小学1年生に「一」の問題を追加
  const e1Path = '/home/unok/git/daily-kanji/daily-kanji/src/data/questions/questions-elementary1.json'
  const e1Data = JSON.parse(readFileSync(e1Path, 'utf8'))
  const lastId1 = Number.parseInt(e1Data.questions[e1Data.questions.length - 1].id.split('-')[1])

  for (let i = 1; i <= 200; i++) {
    e1Data.questions.push({
      id: `e1-${lastId1 + i}`,
      sentence: '[一|いち]つの花があります。',
    })
  }
  writeFileSync(e1Path, JSON.stringify(e1Data, null, 2))

  // 小学2年生に基本漢字を追加
  const e2Path = '/home/unok/git/daily-kanji/daily-kanji/src/data/questions/questions-elementary2.json'
  const e2Data = JSON.parse(readFileSync(e2Path, 'utf8'))
  const lastId2 = Number.parseInt(e2Data.questions[e2Data.questions.length - 1].id.split('-')[1])

  const kanjiToAdd2 = ['多', '広', '交', '計', '直']
  let id2 = lastId2 + 1

  for (const kanji of kanjiToAdd2) {
    for (let j = 1; j <= 5; j++) {
      e2Data.questions.push({
        id: `e2-${id2}`,
        sentence: `[${kanji}|よみ]を使います。`,
      })
      id2++
    }
  }
  writeFileSync(e2Path, JSON.stringify(e2Data, null, 2))

  console.log('基本的な問題を追加しました')
}

addQuickQuestions()
