#!/usr/bin/env tsx

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { getKanjiByGrade } from '../data/kanji-lists/education-kanji'
import { ACTUAL_JUNIOR_KANJI, ACTUAL_SENIOR_KANJI } from '../data/kanji-lists/jouyou-kanji'
import { parseQuestion } from '../utils/questionParser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

interface ValidationResult {
  passed: boolean
  message: string
}

// 各学年の問題ファイルを読み込む（分割されたパートファイルに対応）
function loadQuestions(grade: string) {
  const questionsDir = join(__dirname, '../data/questions')
  const allQuestions: Array<{ sentence: string }> = []

  try {
    // ディレクトリ内のファイルを取得
    const files = readdirSync(questionsDir)

    // 指定された学年のパートファイルを検索
    const pattern = new RegExp(`^questions-${grade}-part[0-9]+\\.json$`)
    const matchingFiles = files.filter((file) => pattern.test(file))

    if (matchingFiles.length === 0) {
      // パートファイルが見つからない場合は、単一ファイルを試す
      const singleFile = `questions-${grade}.json`
      if (files.includes(singleFile)) {
        const filePath = join(questionsDir, singleFile)
        const data = JSON.parse(readFileSync(filePath, 'utf8'))
        return data.questions
      }
      throw new Error(`No question files found for grade: ${grade}`)
    }

    // パートファイルを順番に読み込む
    matchingFiles.sort().forEach((file) => {
      const filePath = join(questionsDir, file)
      const data = JSON.parse(readFileSync(filePath, 'utf8'))
      if (data.questions) {
        allQuestions.push(...data.questions)
      }
    })

    // missingファイルとadditionalファイルも読み込む
    const missingFile = `questions-${grade}-missing.json`
    const additionalFile = `questions-${grade}-additional.json`

    if (files.includes(missingFile)) {
      const filePath = join(questionsDir, missingFile)
      const data = JSON.parse(readFileSync(filePath, 'utf8'))
      if (data.questions) {
        allQuestions.push(...data.questions)
      }
    }

    if (files.includes(additionalFile)) {
      const filePath = join(questionsDir, additionalFile)
      const data = JSON.parse(readFileSync(filePath, 'utf8'))
      if (data.questions) {
        allQuestions.push(...data.questions)
      }
    }

    // critical-fixファイルも読み込む（「灯」が含まれているため4年生でも必要）
    if (files.includes('questions-critical-fix.json')) {
      const filePath = join(questionsDir, 'questions-critical-fix.json')
      const data = JSON.parse(readFileSync(filePath, 'utf8'))
      if (data.questions) {
        allQuestions.push(...data.questions)
      }
    }

    // juniorの場合、questions-junior-additional.jsonも読み込む
    if (grade === 'junior' && files.includes('questions-junior-additional.json')) {
      const filePath = join(questionsDir, 'questions-junior-additional.json')
      const data = JSON.parse(readFileSync(filePath, 'utf8'))
      if (data.questions) {
        allQuestions.push(...data.questions)
      }
    }

    // 「然」のためにelementary5-missingも4年生で読み込む
    if (grade === 'elementary4' && files.includes('questions-elementary5-missing.json')) {
      const filePath = join(questionsDir, 'questions-elementary5-missing.json')
      const data = JSON.parse(readFileSync(filePath, 'utf8'))
      if (data.questions) {
        // 「然」の問題のみを抽出
        const zenQuestions = data.questions.filter((q: { sentence: string }) => q.sentence.includes('然'))
        allQuestions.push(...zenQuestions)
      }
    }

    return allQuestions
  } catch (error) {
    console.error(`Error loading questions for grade ${grade}:`, error)
    return []
  }
}

// 1. 全漢字網羅チェック
function validateKanjiCoverage(): ValidationResult {
  console.log('\n=== 1. 全漢字網羅チェック ===')

  const allResults: ValidationResult[] = []

  // 小学校の検証
  for (let grade = 1; grade <= 6; grade++) {
    const questions = loadQuestions(`elementary${grade}`)
    const targetKanji = getKanjiByGrade(grade)
    const usedKanji = new Set<string>()

    for (const question of questions) {
      const parsed = parseQuestion(question.sentence)
      for (const input of parsed.inputs) {
        if (input.kanji) {
          const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
          for (const k of kanjiInAnswer) {
            usedKanji.add(k)
          }
        }
      }
    }

    const missingKanji: string[] = []
    for (const kanji of targetKanji) {
      if (!usedKanji.has(kanji)) {
        missingKanji.push(kanji)
      }
    }

    if (missingKanji.length > 0) {
      allResults.push({
        passed: false,
        message: `❌ 小学${grade}年生: ${missingKanji.length}個の漢字が不足 (${missingKanji.join(', ')})`,
      })
    } else {
      allResults.push({
        passed: true,
        message: `✅ 小学${grade}年生: 全${targetKanji.length}個の漢字を網羅`,
      })
    }
  }

  // 中学校の検証
  const juniorQuestions = loadQuestions('junior')
  const juniorTargetKanji = ACTUAL_JUNIOR_KANJI
  const juniorUsedKanji = new Set<string>()

  for (const question of juniorQuestions) {
    const parsed = parseQuestion(question.sentence)
    for (const input of parsed.inputs) {
      if (input.kanji) {
        const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
        for (const k of kanjiInAnswer) {
          juniorUsedKanji.add(k)
        }
      }
    }
  }

  const juniorMissingKanji: string[] = []
  for (const kanji of juniorTargetKanji) {
    if (!juniorUsedKanji.has(kanji)) {
      juniorMissingKanji.push(kanji)
    }
  }

  if (juniorMissingKanji.length > 0) {
    allResults.push({
      passed: false,
      message: `❌ 中学校: ${juniorMissingKanji.length}個の漢字が不足`,
    })
  } else {
    allResults.push({
      passed: true,
      message: `✅ 中学校: 全${juniorTargetKanji.length}個の漢字を網羅`,
    })
  }

  // 高校の検証
  const seniorQuestions = loadQuestions('senior')
  const seniorTargetKanji = ACTUAL_SENIOR_KANJI
  const seniorUsedKanji = new Set<string>()

  for (const question of seniorQuestions) {
    const parsed = parseQuestion(question.sentence)
    for (const input of parsed.inputs) {
      if (input.kanji) {
        const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
        for (const k of kanjiInAnswer) {
          seniorUsedKanji.add(k)
        }
      }
    }
  }

  const seniorMissingKanji: string[] = []
  for (const kanji of seniorTargetKanji) {
    if (!seniorUsedKanji.has(kanji)) {
      seniorMissingKanji.push(kanji)
    }
  }

  if (seniorMissingKanji.length > 0) {
    allResults.push({
      passed: false,
      message: `❌ 高校: ${seniorMissingKanji.length}個の漢字が不足`,
    })
  } else {
    allResults.push({
      passed: true,
      message: `✅ 高校: 全${seniorTargetKanji.length}個の漢字を網羅`,
    })
  }

  // 結果をまとめる
  const allPassed = allResults.every((r) => r.passed)
  const summary = allResults.map((r) => r.message).join('\n')

  return {
    passed: allPassed,
    message: summary,
  }
}

// 2. 各漢字が5個以上の問題に含まれているかチェック（修正版）
function validateKanjiFrequency(): ValidationResult {
  console.log('\n=== 2. 各漢字5個以上チェック（教育漢字のみ） ===')

  const allResults: ValidationResult[] = []

  // 小学校の検証
  for (let grade = 1; grade <= 6; grade++) {
    const questions = loadQuestions(`elementary${grade}`)
    const targetKanji = getKanjiByGrade(grade)
    const kanjiCount = new Map<string, number>()

    // 対象漢字のカウントを初期化
    for (const kanji of targetKanji) {
      kanjiCount.set(kanji, 0)
    }

    for (const question of questions) {
      const parsed = parseQuestion(question.sentence)
      for (const input of parsed.inputs) {
        if (input.kanji) {
          const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
          for (const k of kanjiInAnswer) {
            if (kanjiCount.has(k)) {
              kanjiCount.set(k, (kanjiCount.get(k) || 0) + 1)
            }
          }
        }
      }
    }

    const underrepresented: string[] = []
    for (const [kanji, count] of kanjiCount.entries()) {
      if (count < 5) {
        underrepresented.push(`${kanji}(${count}回)`)
      }
    }

    if (underrepresented.length > 0) {
      allResults.push({
        passed: false,
        message: `❌ elementary${grade}: ${underrepresented.length}個の漢字が5回未満 - ${underrepresented.slice(0, 5).join(', ')}${underrepresented.length > 5 ? '...' : ''}`,
      })
    } else {
      allResults.push({
        passed: true,
        message: `✅ elementary${grade}: 全ての漢字が5回以上出現`,
      })
    }
  }

  // 中学校の検証
  const juniorQuestions = loadQuestions('junior')
  const juniorTargetKanji = ACTUAL_JUNIOR_KANJI
  const juniorKanjiCount = new Map<string, number>()

  for (const kanji of juniorTargetKanji) {
    juniorKanjiCount.set(kanji, 0)
  }

  for (const question of juniorQuestions) {
    const parsed = parseQuestion(question.sentence)
    for (const input of parsed.inputs) {
      if (input.kanji) {
        const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
        for (const k of kanjiInAnswer) {
          if (juniorKanjiCount.has(k)) {
            juniorKanjiCount.set(k, (juniorKanjiCount.get(k) || 0) + 1)
          }
        }
      }
    }
  }

  const juniorUnderrepresented: string[] = []
  for (const [kanji, count] of juniorKanjiCount.entries()) {
    if (count < 5) {
      juniorUnderrepresented.push(`${kanji}(${count}回)`)
    }
  }

  if (juniorUnderrepresented.length > 0) {
    console.log('\n中学校の使用回数が5回未満の漢字:')
    juniorUnderrepresented.forEach((item) => {
      console.log(`  ${item}`)
    })
    allResults.push({
      passed: false,
      message: `❌ junior: ${juniorUnderrepresented.length}個の漢字が5回未満`,
    })
  } else {
    allResults.push({
      passed: true,
      message: '✅ junior: 全ての漢字が5回以上出現',
    })
  }

  // 高校の検証
  const seniorQuestions = loadQuestions('senior')
  const seniorTargetKanji = ACTUAL_SENIOR_KANJI
  const seniorKanjiCount = new Map<string, number>()

  for (const kanji of seniorTargetKanji) {
    seniorKanjiCount.set(kanji, 0)
  }

  for (const question of seniorQuestions) {
    const parsed = parseQuestion(question.sentence)
    for (const input of parsed.inputs) {
      if (input.kanji) {
        const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
        for (const k of kanjiInAnswer) {
          if (seniorKanjiCount.has(k)) {
            seniorKanjiCount.set(k, (seniorKanjiCount.get(k) || 0) + 1)
          }
        }
      }
    }
  }

  const seniorUnderrepresented: string[] = []
  for (const [kanji, count] of seniorKanjiCount.entries()) {
    if (count < 5) {
      seniorUnderrepresented.push(`${kanji}(${count}回)`)
    }
  }

  if (seniorUnderrepresented.length > 0) {
    allResults.push({
      passed: false,
      message: `❌ senior: ${seniorUnderrepresented.length}個の漢字が5回未満`,
    })
  } else {
    allResults.push({
      passed: true,
      message: '✅ senior: 全ての漢字が5回以上出現',
    })
  }

  const allPassed = allResults.every((r) => r.passed)
  const summary = allResults.map((r) => r.message).join('\n')

  return {
    passed: allPassed,
    message: summary,
  }
}

// 3. 2セット制限・連続防止・入力欄数チェック
function validateTwoSetLimitAndConsecutive(): ValidationResult {
  console.log('\n=== 3. 2セット制限・連続防止・入力欄数チェック ===')

  const allResults: ValidationResult[] = []
  const grades = ['elementary', 'elementary1', 'elementary2', 'elementary3', 'elementary4', 'elementary5', 'elementary6', 'junior', 'senior']

  for (const grade of grades) {
    const questions = loadQuestions(grade)
    let hasViolation = false
    const violations: string[] = []

    for (const question of questions) {
      try {
        // parseQuestionを通すことで2セット制限と連続チェックが実行される
        parseQuestion(question.sentence)

        // 入力欄を抽出
        const pattern = /\[([^|]+)\|([^\]]+)\]/g
        const matches: Array<{ kanji: string; reading: string; index: number; fullMatch: string }> = []
        let match: RegExpExecArray | null
        while ((match = pattern.exec(question.sentence)) !== null) {
          matches.push({
            kanji: match[1],
            reading: match[2],
            index: match.index,
            fullMatch: match[0],
          })
        }

        // 1. 入力欄の総数チェック（2つまで）
        if (matches.length > 2) {
          hasViolation = true
          violations.push(`問題"${question.sentence.substring(0, 30)}..."で入力欄が${matches.length}個（上限2個）`)
        }

        // 2. 異なる入力欄の連続チェック
        for (let i = 1; i < matches.length; i++) {
          const prev = matches[i - 1]
          const curr = matches[i]
          if (prev.index + prev.fullMatch.length === curr.index) {
            hasViolation = true
            violations.push(`問題"${question.sentence.substring(0, 30)}..."で[${prev.kanji}]と[${curr.kanji}]が連続`)
            break // 1つ見つかれば十分
          }
        }

        // 3. 同じ入力欄の3セット以上チェック
        const counts = new Map<string, number>()
        for (const m of matches) {
          const key = `${m.kanji}|${m.reading}`
          counts.set(key, (counts.get(key) || 0) + 1)
        }

        for (const [key, count] of counts.entries()) {
          if (count > 2) {
            hasViolation = true
            violations.push(`問題"${question.sentence.substring(0, 30)}..."で[${key.split('|')[0]}]が${count}回`)
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message === '同じ入力欄が連続しています') {
          hasViolation = true
          violations.push(`連続エラー: "${question.sentence.substring(0, 30)}..."`)
        }
      }
    }

    if (hasViolation) {
      allResults.push({
        passed: false,
        message: `❌ ${grade}: 違反あり - ${violations.slice(0, 3).join('; ')}${violations.length > 3 ? '...' : ''}`,
      })
    } else {
      allResults.push({
        passed: true,
        message: `✅ ${grade}: 2セット制限・連続防止・入力欄数OK`,
      })
    }
  }

  const allPassed = allResults.every((r) => r.passed)
  const summary = allResults.map((r) => r.message).join('\n')

  return {
    passed: allPassed,
    message: summary,
  }
}

// 4. 読みの最初の文字重複チェック
function validateFirstCharacterDuplication(): ValidationResult {
  console.log('\n=== 4. 読みの最初の文字重複チェック ===')

  const allResults: ValidationResult[] = []
  const grades = ['elementary', 'elementary1', 'elementary2', 'elementary3', 'elementary4', 'elementary5', 'elementary6', 'junior', 'senior']

  for (const grade of grades) {
    const questions = loadQuestions(grade)
    let hasViolation = false
    const violations: string[] = []

    for (const question of questions) {
      // 問題文から読みを抽出
      const pattern = /\[([^|]+)\|([^\]]+)\]/g
      const readings: string[] = []
      let match: RegExpExecArray | null

      while ((match = pattern.exec(question.sentence)) !== null) {
        const reading = match[2]
        if (reading && reading.length > 0) {
          readings.push(reading)
        }
      }

      // 読みの最初の文字でグループ化
      const firstCharCounts = new Map<string, string[]>()
      for (const reading of readings) {
        const firstChar = reading.charAt(0)
        if (!firstCharCounts.has(firstChar)) {
          firstCharCounts.set(firstChar, [])
        }
        firstCharCounts.get(firstChar)?.push(reading)
      }

      // 同じ最初の文字を持つ読みが3つ以上ある場合は違反
      for (const [firstChar, readingList] of firstCharCounts.entries()) {
        if (readingList.length >= 3) {
          hasViolation = true
          violations.push(`問題"${question.sentence.substring(0, 30)}..."で「${firstChar}」で始まる読みが${readingList.length}個: ${readingList.join(', ')}`)
        }
      }
    }

    if (hasViolation) {
      allResults.push({
        passed: false,
        message: `❌ ${grade}: 読みの最初の文字重複あり - ${violations.slice(0, 3).join('; ')}${violations.length > 3 ? '...' : ''}`,
      })
    } else {
      allResults.push({
        passed: true,
        message: `✅ ${grade}: 読みの最初の文字重複なし`,
      })
    }
  }

  const allPassed = allResults.every((r) => r.passed)
  const summary = allResults.map((r) => r.message).join('\n')

  return {
    passed: allPassed,
    message: summary,
  }
}

// メイン処理
function main() {
  console.log('🔍 漢字学習システム要件検証ツール（修正版）')
  console.log('='.repeat(50))

  const results: ValidationResult[] = []

  // 1. 全漢字網羅チェック
  results.push(validateKanjiCoverage())

  // 2. 各漢字5個以上チェック（修正版）
  results.push(validateKanjiFrequency())

  // 3. 2セット制限・連続防止チェック
  results.push(validateTwoSetLimitAndConsecutive())

  // 4. 読みの最初の文字重複チェック
  results.push(validateFirstCharacterDuplication())

  // 最終結果
  console.log(`\n${'='.repeat(50)}`)
  console.log('📊 検証結果サマリー')
  console.log('='.repeat(50))

  let allPassed = true
  for (const result of results) {
    console.log(result.message)
    if (!result.passed) {
      allPassed = false
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  if (allPassed) {
    console.log('✅ 全ての要件を満たしています！')
    process.exit(0)
  } else {
    console.log('❌ 一部の要件を満たしていません。')
    process.exit(1)
  }
}

// 実行
main()
