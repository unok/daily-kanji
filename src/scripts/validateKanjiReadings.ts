#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'

interface KanjiReadings {
  [kanji: string]: string[]
}

interface CompoundReadings {
  [compound: string]: string[]
}

// 漢字読み方データを読み込む
function loadKanjiReadings(): KanjiReadings {
  const filePath = path.join(process.cwd(), 'src/data/kanji-readings/kanji-readings.json')
  const content = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(content)
}

// 熟語読み方データを読み込む
function loadCompoundReadings(): CompoundReadings {
  const filePath = path.join(process.cwd(), 'src/data/kanji-readings/compound-readings.json')
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(content)
  } catch {
    return {}
  }
}

// 文章から[漢字|読み]のペアを抽出
function extractKanjiReadingPairs(sentence: string): Array<[string, string]> {
  const pattern = /\[([^|]+)\|([^\]]+)\]/g
  const matches: Array<[string, string]> = []
  let match: RegExpExecArray | null
  match = pattern.exec(sentence)
  while (match !== null) {
    matches.push([match[1], match[2]])
    match = pattern.exec(sentence)
  }
  return matches
}

// 読み方の妥当性を検証
function validateReading(
  kanjiText: string,
  reading: string,
  kanjiReadings: KanjiReadings,
  compoundReadings: CompoundReadings
): { isValid: boolean; reason?: string } {
  // まず熟語辞書をチェック
  if (kanjiText in compoundReadings) {
    const validCompoundReadings = compoundReadings[kanjiText]
    if (validCompoundReadings.includes(reading)) {
      return { isValid: true }
    }
  }

  // 単漢字の場合
  if (kanjiText.length === 1) {
    if (kanjiText in kanjiReadings) {
      const validReadings = kanjiReadings[kanjiText]
      if (validReadings.includes(reading)) {
        return { isValid: true }
      }
      return { isValid: false, reason: `有効な読み: ${validReadings.join(', ')}` }
    }
    return { isValid: false, reason: '漢字が辞書に見つかりません' }
  }

  // 複数漢字（熟語）の場合 - 各漢字の読みから合成可能かチェック
  // この部分は複雑なので、熟語辞書にない場合は警告として扱う
  return { isValid: false, reason: '熟語辞書に登録されていません' }
}

// 問題ファイルを検証
function validateQuestionFiles() {
  console.log('🔍 漢字読み方検証ツール (TypeScript版)')
  console.log('================================================================================')

  const kanjiReadings = loadKanjiReadings()
  const compoundReadings = loadCompoundReadings()

  console.log(`📚 ${Object.keys(kanjiReadings).length}個の漢字読み方をロード`)
  console.log(`📚 ${Object.keys(compoundReadings).length}個の熟語読み方をロード`)
  console.log()

  // 問題ファイルを検索
  const questionsDir = path.join(process.cwd(), 'src/data/questions')
  const questionFiles = fs
    .readdirSync(questionsDir)
    .filter((file) => file.startsWith('questions-') && file.endsWith('.json'))
    .map((file) => path.join(questionsDir, file))

  let totalErrors = 0
  let totalWarnings = 0

  for (const file of questionFiles) {
    const content = fs.readFileSync(file, 'utf8')
    const data = JSON.parse(content)

    const errors: string[] = []
    const warnings: string[] = []

    for (const question of data.questions) {
      const pairs = extractKanjiReadingPairs(question.sentence)

      for (const [kanjiText, reading] of pairs) {
        const result = validateReading(kanjiText, reading, kanjiReadings, compoundReadings)

        if (!result.isValid) {
          if (kanjiText.length > 1 && !(kanjiText in compoundReadings)) {
            // 熟語辞書にない場合は警告
            warnings.push(`${question.id}: [${kanjiText}|${reading}] - ${result.reason}`)
          } else {
            // それ以外はエラー
            errors.push(`${question.id}: [${kanjiText}|${reading}] - ${result.reason}`)
          }
        }
      }
    }

    if (errors.length > 0 || warnings.length > 0) {
      console.log(`\n📄 ${path.basename(file)}:`)

      if (errors.length > 0) {
        console.log(`  ❌ エラー: ${errors.length}件`)
        for (const e of errors.slice(0, 5)) {
          console.log(`    ${e}`)
        }
        if (errors.length > 5) {
          console.log(`    ... 他${errors.length - 5}件`)
        }
      }

      if (warnings.length > 0) {
        console.log(`  ⚠️  警告: ${warnings.length}件`)
        for (const w of warnings.slice(0, 3)) {
          console.log(`    ${w}`)
        }
        if (warnings.length > 3) {
          console.log(`    ... 他${warnings.length - 3}件`)
        }
      }
    }

    totalErrors += errors.length
    totalWarnings += warnings.length
  }

  console.log('\n================================================================================')
  console.log('📊 検証結果サマリー')
  console.log('================================================================================')

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('✅ 全ての読み方が正しいです！')
  } else {
    if (totalErrors > 0) {
      console.log(`❌ エラー: ${totalErrors}件`)
    }
    if (totalWarnings > 0) {
      console.log(`⚠️  警告: ${totalWarnings}件（熟語辞書への登録を検討してください）`)
    }
  }

  // エラーがある場合は終了コード1
  if (totalErrors > 0) {
    process.exit(1)
  }
}

// メイン処理
validateQuestionFiles()
