import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 学年別の漢字データを読み込む
async function loadGradeKanji(): Promise<Map<string, string[]>> {
  const gradeKanjiMap = new Map<string, string[]>()

  // education-kanji.tsから小学校の漢字を読み込む
  const educationKanjiPath = path.join(__dirname, '../data/kanji-lists/education-kanji.ts')
  const educationKanjiContent = await fs.readFile(educationKanjiPath, 'utf-8')

  // EDUCATION_KANJIオブジェクトを抽出
  const educationKanjiMatch = educationKanjiContent.match(/export const EDUCATION_KANJI = ({[\s\S]*?})\s*\n\s*export/m)
  if (!educationKanjiMatch) {
    throw new Error('EDUCATION_KANJIが見つかりません')
  }

  const educationKanjiStr = educationKanjiMatch[1]

  // 各学年のデータを抽出（1-6年）
  for (let grade = 1; grade <= 6; grade++) {
    const gradeRegex = new RegExp(`${grade}:\\s*\\[([\\s\\S]*?)\\](?:,|\\s*})`, 'm')
    const gradeMatch = educationKanjiStr.match(gradeRegex)
    if (gradeMatch) {
      const kanjiArrayStr = gradeMatch[1]
      const kanjiList = kanjiArrayStr.match(/'([^']+)'/g)?.map((k) => k.slice(1, -1)) || []
      gradeKanjiMap.set(`${grade}`, kanjiList)
    }
  }

  // jouyou-kanji.tsから中学校の漢字を読み込む
  const jouyouKanjiPath = path.join(__dirname, '../data/kanji-lists/jouyou-kanji.ts')
  const jouyouKanjiContent = await fs.readFile(jouyouKanjiPath, 'utf-8')

  // MIDDLE_SCHOOL_KANJIを抽出
  const juniorKanjiMatch = jouyouKanjiContent.match(/export const MIDDLE_SCHOOL_KANJI = \[([\s\S]*?)\]/m)
  if (juniorKanjiMatch) {
    const kanjiArrayStr = juniorKanjiMatch[1]
    const kanjiList = kanjiArrayStr.match(/'([^']+)'/g)?.map((k) => k.slice(1, -1)) || []
    gradeKanjiMap.set('junior', kanjiList)
  }

  return gradeKanjiMap
}

// 問題データから漢字の使用頻度をカウント
async function countKanjiUsage(): Promise<Map<string, Map<string, number>>> {
  const questionsDir = path.join(__dirname, '../data/questions')
  const files = await fs.readdir(questionsDir)
  const questionFiles = files.filter((file) => file.startsWith('questions-') && file.endsWith('.json'))

  // 学年別の漢字使用回数を記録
  const gradeKanjiCount = new Map<string, Map<string, number>>()

  for (const file of questionFiles) {
    const filePath = path.join(questionsDir, file)
    const content = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(content)

    // ファイル名から学年を判定
    let grade: string
    if (file.includes('elementary1')) grade = '1'
    else if (file.includes('elementary2')) grade = '2'
    else if (file.includes('elementary3')) grade = '3'
    else if (file.includes('elementary4')) grade = '4'
    else if (file.includes('elementary5')) grade = '5'
    else if (file.includes('elementary6')) grade = '6'
    else if (file.includes('junior')) grade = 'junior'
    else continue

    if (!gradeKanjiCount.has(grade)) {
      gradeKanjiCount.set(grade, new Map<string, number>())
    }

    const kanjiCount = gradeKanjiCount.get(grade) || new Map<string, number>()

    // 各問題文から[漢字|読み]形式の漢字を抽出
    for (const question of data.questions) {
      const matches = question.sentence.match(/\[([^|\]]+)\|[^|\]]+\]/g)
      if (matches) {
        for (const match of matches) {
          const kanji = match.match(/\[([^|\]]+)\|/)?.[1]
          if (kanji) {
            // 漢字の各文字をカウント
            for (const char of kanji) {
              // 通常の漢字範囲 + CJK拡張Bの𠮟を含む範囲
              if (/[\u4e00-\u9faf\u{20000}-\u{2A6DF}]/u.test(char)) {
                kanjiCount.set(char, (kanjiCount.get(char) || 0) + 1)
              }
            }
          }
        }
      }
    }
  }

  return gradeKanjiCount
}

// メイン処理
async function main() {
  console.log('=== 漢字利用頻度分析 ===\n')

  // 学年別漢字データを読み込み
  const gradeKanjiMap = await loadGradeKanji()

  // 漢字使用頻度をカウント
  const gradeKanjiCount = await countKanjiUsage()

  // 各学年の分析結果を表示
  const grades = [
    { key: '1', name: '小学1年生' },
    { key: '2', name: '小学2年生' },
    { key: '3', name: '小学3年生' },
    { key: '4', name: '小学4年生' },
    { key: '5', name: '小学5年生' },
    { key: '6', name: '小学6年生' },
    { key: 'junior', name: '中学校' },
  ]

  let totalUnderUsed = 0

  for (const { key, name } of grades) {
    console.log(`\n📚 ${name}`)
    console.log('─'.repeat(50))

    const kanjiList = gradeKanjiMap.get(key) || []
    const kanjiCount = gradeKanjiCount.get(key) || new Map()

    // 5回未満の漢字を抽出
    const underUsedKanji: { kanji: string; count: number }[] = []

    for (const kanji of kanjiList) {
      const count = kanjiCount.get(kanji) || 0
      if (count < 5) {
        underUsedKanji.push({ kanji, count })
      }
    }

    // 使用回数順にソート（少ない順）
    underUsedKanji.sort((a, b) => a.count - b.count)

    console.log(`総漢字数: ${kanjiList.length}字`)
    console.log(`5回以上使用: ${kanjiList.length - underUsedKanji.length}字`)
    console.log(`5回未満使用: ${underUsedKanji.length}字\n`)

    if (underUsedKanji.length > 0) {
      console.log('【5回未満の漢字】')

      // 使用回数別にグループ化
      for (let count = 0; count < 5; count++) {
        const kanjiAtCount = underUsedKanji.filter((item) => item.count === count).map((item) => item.kanji)

        if (kanjiAtCount.length > 0) {
          console.log(`  ${count}回: ${kanjiAtCount.join(' ')} (${kanjiAtCount.length}字)`)
        }
      }
    }

    totalUnderUsed += underUsedKanji.length
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log('\n📊 全体統計')
  console.log(`5回未満の漢字総数: ${totalUnderUsed}字`)
}

// 実行
main().catch(console.error)
