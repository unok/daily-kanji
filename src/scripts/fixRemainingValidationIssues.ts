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

// 残りの漢字重複の修正
const kanjiDuplicationFixes: Record<string, string> = {
  // Elementary4 - 隊が重複
  'e4-1323': '救助[隊|たい]の副隊長に就任しました。',

  // Elementary6 - 激が重複
  'e6-1103': '不正に対して[激|げき]しく憤る気持ちも理解できます。',
}

// 残りの重複文章を探して修正
const searchDuplicateSentences = () => {
  const sentenceMap = new Map<string, { grade: string; ids: string[] }>()

  const patterns = [{ grade: 'elementary4', pattern: /questions-elementary4-part\d+\.json$/ }]

  for (const { grade, pattern } of patterns) {
    const files = fs
      .readdirSync(questionsDir)
      .filter((file) => pattern.test(file))
      .sort()

    for (const file of files) {
      const filePath = path.join(questionsDir, file)
      const data: QuestionsFile = JSON.parse(fs.readFileSync(filePath, 'utf8'))

      for (const question of data.questions) {
        const normalizedSentence = question.sentence.trim()
        if (!sentenceMap.has(normalizedSentence)) {
          sentenceMap.set(normalizedSentence, { grade, ids: [] })
        }
        const entry = sentenceMap.get(normalizedSentence)
        if (entry) {
          entry.ids.push(question.id)
        }
      }
    }
  }

  // 重複を見つける
  const duplicates: Array<{ sentence: string; ids: string[] }> = []
  for (const [sentence, data] of sentenceMap) {
    if (data.ids.length > 1) {
      duplicates.push({ sentence, ids: data.ids })
    }
  }

  return duplicates
}

// 検索して問題のIDを特定
const duplicates = searchDuplicateSentences()
console.log('重複している文章:')
for (const { sentence, ids } of duplicates) {
  console.log(`  "${sentence.substring(0, 30)}..." - IDs: ${ids.join(', ')}`)
}

// 重複文章の修正マップ（最初のID以外を修正）
const duplicateSentenceFixes: Record<string, string> = {
  // 検索結果に基づいて追加
}

// よくある重複パターンを修正
const commonDuplicates: Record<string, string> = {
  // 節電を心がけます
  'e4-381': '省エネと[節|せつ]電を心がけています。',
  'e4-543': '家庭での[節|せつ]電を実践しています。',

  // 一生懸命働きました
  'e4-483': '目標に向かって一生懸命[働|はたら]きました。',
  'e4-1044': '地域のために一生懸命[働|はたら]きました。',

  // 隊長に任命されました
  'e4-272': '部[隊|たい]長に任命されました。',
  'e4-383': '班の[隊|たい]長に任命されました。',

  // 芽が出ました
  'e4-202': '種から[芽|め]が出ました。',
  'e4-423': '土の中から[芽|め]が出ました。',

  // 試験を受けました
  'e4-304': '資格[試|し]験を受けました。',
  'e4-585': '定期[試|し]験を受けました。',
  'e4-1072': '最終[試|し]験を受けました。',
}

// ファイル処理関数
function processFile(filePath: string): number {
  const data: QuestionsFile = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let modifiedCount = 0

  for (const question of data.questions) {
    let newSentence = question.sentence

    // 漢字重複の修正
    if (kanjiDuplicationFixes[question.id]) {
      newSentence = kanjiDuplicationFixes[question.id]
      modifiedCount++
      console.log(`  Fixed kanji duplication: ${question.id}`)
    }
    // 文章重複の修正
    else if (duplicateSentenceFixes[question.id] || commonDuplicates[question.id]) {
      newSentence = duplicateSentenceFixes[question.id] || commonDuplicates[question.id]
      modifiedCount++
      console.log(`  Fixed sentence duplication: ${question.id}`)
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
const patterns = [/questions-elementary4-part\d+\.json$/, /questions-elementary6-part\d+\.json$/]

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
