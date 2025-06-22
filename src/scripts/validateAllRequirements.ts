#!/usr/bin/env tsx

import { readFileSync } from 'node:fs'

import { getKanjiByGrade } from '../data/kanji-lists/education-kanji'
import { ACTUAL_JUNIOR_KANJI, ACTUAL_SENIOR_KANJI } from '../data/kanji-lists/jouyou-kanji'
import { parseQuestion } from '../utils/questionParser'

interface ValidationResult {
  passed: boolean
  message: string
}

// 各学年の問題ファイルを読み込む
function loadQuestions(grade: string) {
  const filePath = `/home/unok/git/daily-kanji/daily-kanji/src/data/questions/questions-${grade}.json`
  const data = JSON.parse(readFileSync(filePath, 'utf8'))
  return data.questions
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

// 2. 各漢字が5個以上の問題に含まれているかチェック
function validateKanjiFrequency(): ValidationResult {
  console.log('\n=== 2. 各漢字5個以上チェック ===')

  const allResults: ValidationResult[] = []

  // 全学年の検証
  const grades = ['elementary1', 'elementary2', 'elementary3', 'elementary4', 'elementary5', 'elementary6', 'junior', 'senior']

  for (const grade of grades) {
    const questions = loadQuestions(grade)
    const kanjiCount = new Map<string, number>()

    for (const question of questions) {
      const parsed = parseQuestion(question.sentence)
      for (const input of parsed.inputs) {
        if (input.kanji) {
          const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
          for (const k of kanjiInAnswer) {
            kanjiCount.set(k, (kanjiCount.get(k) || 0) + 1)
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
        message: `❌ ${grade}: ${underrepresented.length}個の漢字が5回未満 - ${underrepresented.slice(0, 5).join(', ')}${underrepresented.length > 5 ? '...' : ''}`,
      })
    } else {
      allResults.push({
        passed: true,
        message: `✅ ${grade}: 全ての漢字が5回以上出現`,
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

// 3. 2セット制限と連続防止チェック
function validateTwoSetLimitAndConsecutive(): ValidationResult {
  console.log('\n=== 3. 2セット制限・連続防止チェック ===')

  const allResults: ValidationResult[] = []
  const grades = ['elementary1', 'elementary2', 'elementary3', 'elementary4', 'elementary5', 'elementary6', 'junior', 'senior']

  for (const grade of grades) {
    const questions = loadQuestions(grade)
    let hasViolation = false
    const violations: string[] = []

    for (const question of questions) {
      try {
        // parseQuestionを通すことで2セット制限と連続チェックが実行される
        parseQuestion(question.sentence)

        // 3セット以上ある問題をチェック
        const pattern = /\[([^|]+)\|([^\]]+)\]/g
        const matches: string[] = []
        let match: RegExpExecArray | null
        while ((match = pattern.exec(question.sentence)) !== null) {
          matches.push(`${match[1]}|${match[2]}`)
        }

        const counts = new Map<string, number>()
        for (const m of matches) {
          counts.set(m, (counts.get(m) || 0) + 1)
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
        message: `✅ ${grade}: 2セット制限・連続防止OK`,
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
  console.log('🔍 漢字学習システム要件検証ツール')
  console.log('='.repeat(50))

  const results: ValidationResult[] = []

  // 1. 全漢字網羅チェック
  results.push(validateKanjiCoverage())

  // 2. 各漢字5個以上チェック
  results.push(validateKanjiFrequency())

  // 3. 2セット制限・連続防止チェック
  results.push(validateTwoSetLimitAndConsecutive())

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
