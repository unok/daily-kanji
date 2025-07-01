#!/usr/bin/env tsx

import { readdirSync, readFileSync } from 'node:fs'
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

console.log(`常用漢字総数: ${allJouyouKanji.size}字`)

// kanji-readings.jsonを読み込み
const kanjiReadingsPath = join(__dirname, '../data/kanji-readings/kanji-readings.json')
const kanjiReadings = JSON.parse(readFileSync(kanjiReadingsPath, 'utf-8'))

// compound-readings.jsonを読み込み
const compoundReadingsPath = join(__dirname, '../data/kanji-readings/compound-readings.json')
const compoundReadings = JSON.parse(readFileSync(compoundReadingsPath, 'utf-8'))

// 非常用漢字をチェック
console.log('\n=== kanji-readings.json の非常用漢字 ===\n')
const nonJouyouInReadings: string[] = []
for (const kanji of Object.keys(kanjiReadings)) {
  if (!allJouyouKanji.has(kanji)) {
    nonJouyouInReadings.push(kanji)
  }
}

if (nonJouyouInReadings.length > 0) {
  console.log(`❌ ${nonJouyouInReadings.length}個の非常用漢字が見つかりました:`)
  console.log(nonJouyouInReadings.join(' '))
} else {
  console.log('✅ すべて常用漢字です')
}

// compound-readings.jsonもチェック
console.log('\n=== compound-readings.json の非常用漢字 ===\n')
const nonJouyouInCompounds = new Set<string>()

for (const compound of Object.keys(compoundReadings)) {
  for (const char of compound) {
    if (char.match(/[\u4E00-\u9FAF]/) && !allJouyouKanji.has(char)) {
      nonJouyouInCompounds.add(char)
    }
  }
}

if (nonJouyouInCompounds.size > 0) {
  console.log(`❌ ${nonJouyouInCompounds.size}個の非常用漢字が見つかりました:`)
  console.log(Array.from(nonJouyouInCompounds).join(' '))
} else {
  console.log('✅ すべて常用漢字です')
}

// 問題ファイルもチェック
console.log('\n=== 問題文中の非常用漢字 ===\n')
const questionsDir = join(__dirname, '../data/questions')
const files = readdirSync(questionsDir).filter((f: string) => f.endsWith('.json'))

const nonJouyouInQuestions = new Map<string, string[]>()

for (const file of files) {
  const filePath = join(questionsDir, file)
  const content = readFileSync(filePath, 'utf-8')
  const data = JSON.parse(content)

  const fileNonJouyou = new Set<string>()

  for (const question of data.questions) {
    const sentence = question.sentence
    // 全ての漢字を抽出
    const kanjiMatches = sentence.match(/[\u4E00-\u9FAF]/g) || []

    for (const kanji of kanjiMatches) {
      if (!allJouyouKanji.has(kanji)) {
        fileNonJouyou.add(kanji)
      }
    }
  }

  if (fileNonJouyou.size > 0) {
    nonJouyouInQuestions.set(file, Array.from(fileNonJouyou))
  }
}

if (nonJouyouInQuestions.size > 0) {
  console.log(`❌ ${nonJouyouInQuestions.size}個のファイルに非常用漢字が見つかりました:\n`)
  for (const [file, kanjis] of nonJouyouInQuestions) {
    console.log(`${file}: ${kanjis.join(' ')}`)
  }
} else {
  console.log('✅ すべて常用漢字です')
}
