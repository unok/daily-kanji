#!/usr/bin/env tsx

import * as fs from 'node:fs'
import * as path from 'node:path'

interface ShortSentence {
  id: string
  sentence: string
  cleanSentence: string
  length: number
  file: string
  grade: string
}

const main = () => {
  const questionsDir = path.join(process.cwd(), 'src/data/questions')
  const files = fs.readdirSync(questionsDir).filter((f) => f.endsWith('.json'))

  const shortSentences: ShortSentence[] = []

  for (const file of files) {
    const filePath = path.join(questionsDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(content)

    // ファイル名から学年を抽出
    const gradeMatch = file.match(/(elementary|junior)(\d+)?/)
    const grade = gradeMatch ? (gradeMatch[1] === 'elementary' ? `小${gradeMatch[2] || ''}` : '中') : '不明'

    for (const question of data.questions) {
      const { id, sentence } = question
      const cleanSentence = sentence.replace(/\[([^|]+)\|[^\]]+\]/g, '$1')

      if (cleanSentence.length < 9) {
        shortSentences.push({
          id,
          sentence,
          cleanSentence,
          length: cleanSentence.length,
          file,
          grade,
        })
      }
    }
  }

  // 文字数別の分析
  const lengthGroups = new Map<number, number>()
  for (const item of shortSentences) {
    lengthGroups.set(item.length, (lengthGroups.get(item.length) || 0) + 1)
  }

  console.log('=== 短文の詳細分析 ===')
  console.log(`総短文数: ${shortSentences.length}`)

  console.log('\n文字数別の分布:')
  for (let i = 1; i <= 8; i++) {
    const count = lengthGroups.get(i) || 0
    if (count > 0) {
      console.log(`  ${i}文字: ${count}件`)
    }
  }

  // パターン別分析のサンプル表示
  console.log('\n=== パターン別分析 ===')

  // 各文字数ごとにサンプルを表示
  for (let len = 4; len <= 8; len++) {
    const samples = shortSentences.filter((s) => s.length === len).slice(0, 15)
    if (samples.length > 0) {
      console.log(`\n【${len}文字の例】`)
      for (const sample of samples) {
        console.log(`  ${sample.id} (${sample.grade}): "${sample.sentence}"`)
        console.log(`    → "${sample.cleanSentence}"`)
      }
    }
  }

  // 動詞パターンの分析
  console.log('\n=== 動詞パターンの分析 ===')
  const verbPatterns = new Map<string, ShortSentence[]>()

  for (const sentence of shortSentences.slice(0, 100)) {
    const clean = sentence.cleanSentence
    if (clean.includes('ました')) {
      const key = 'ました形'
      if (!verbPatterns.has(key)) verbPatterns.set(key, [])
      verbPatterns.get(key)?.push(sentence)
    } else if (clean.includes('です')) {
      const key = 'です形'
      if (!verbPatterns.has(key)) verbPatterns.set(key, [])
      verbPatterns.get(key)?.push(sentence)
    } else if (clean.includes('でした')) {
      const key = 'でした形'
      if (!verbPatterns.has(key)) verbPatterns.set(key, [])
      verbPatterns.get(key)?.push(sentence)
    }
  }

  for (const [pattern, sentences] of verbPatterns) {
    console.log(`\n${pattern} (${sentences.length}件の例):`)
    for (const s of sentences.slice(0, 5)) {
      console.log(`  "${s.cleanSentence}"`)
    }
  }
}

main()
