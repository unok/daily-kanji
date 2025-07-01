#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 教育漢字を読み込み
import { EDUCATION_KANJI } from '../data/kanji-lists/education-kanji'
import { MIDDLE_SCHOOL_KANJI } from '../data/kanji-lists/jouyou-kanji'

// 全常用漢字のセットを作成
const allJouyouKanji = new Set<string>()

// 小学校の漢字を追加
for (const grade of Object.values(EDUCATION_KANJI)) {
  for (const kanji of grade) {
    allJouyouKanji.add(kanji)
  }
}

// 中学校の漢字を追加
for (const kanji of MIDDLE_SCHOOL_KANJI) {
  allJouyouKanji.add(kanji)
}

// kanji-readings.jsonを読み込み
const kanjiReadingsPath = join(__dirname, '../data/kanji-readings/kanji-readings.json')
const kanjiReadings = JSON.parse(readFileSync(kanjiReadingsPath, 'utf-8'))

// 非常用漢字を削除
const filteredKanjiReadings: Record<string, string[]> = {}
let removedCount = 0

for (const [kanji, readings] of Object.entries(kanjiReadings)) {
  if (allJouyouKanji.has(kanji)) {
    filteredKanjiReadings[kanji] = readings as string[]
  } else {
    console.log(`削除: ${kanji}`)
    removedCount++
  }
}

console.log(`\n${removedCount}個の非常用漢字を削除しました`)

// ファイルに書き戻す
writeFileSync(kanjiReadingsPath, JSON.stringify(filteredKanjiReadings, null, 2))
console.log('\nkanji-readings.jsonを更新しました')

// compound-readings.jsonも処理
const compoundReadingsPath = join(__dirname, '../data/kanji-readings/compound-readings.json')
const compoundReadings = JSON.parse(readFileSync(compoundReadingsPath, 'utf-8'))

// 非常用漢字を含む複合語を削除
const filteredCompoundReadings: Record<string, string[]> = {}
let removedCompounds = 0

for (const [compound, readings] of Object.entries(compoundReadings)) {
  let hasNonJouyou = false
  for (const char of compound) {
    if (char.match(/[\u4E00-\u9FAF]/) && !allJouyouKanji.has(char)) {
      hasNonJouyou = true
      break
    }
  }

  if (!hasNonJouyou) {
    filteredCompoundReadings[compound] = readings as string[]
  } else {
    console.log(`複合語削除: ${compound}`)
    removedCompounds++
  }
}

console.log(`\n${removedCompounds}個の非常用漢字を含む複合語を削除しました`)

// ファイルに書き戻す
writeFileSync(compoundReadingsPath, JSON.stringify(filteredCompoundReadings, null, 2))
console.log('\ncompound-readings.jsonを更新しました')
