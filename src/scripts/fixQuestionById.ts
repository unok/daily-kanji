import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getAllKanjiSet, getGradeKanjiList, loadReadingData, type Question, validateQuestionWithGrade } from './utils/validation.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface QuestionsFile {
  questions: Question[]
}

// ファイル名から学年を判定
function getTargetGradeFromFileName(fileName: string): number {
  if (fileName.includes('elementary1')) return 1
  if (fileName.includes('elementary2')) return 2
  if (fileName.includes('elementary3')) return 3
  if (fileName.includes('elementary4')) return 4
  if (fileName.includes('elementary5')) return 5
  if (fileName.includes('elementary6')) return 6
  if (fileName.includes('junior')) return 7
  return 7 // デフォルトは中学校
}

// コマンドライン引数を取得
const args = process.argv.slice(2)
if (args.length !== 2) {
  console.error('使用方法: npx tsx src/scripts/fixQuestionById.ts <ID> <新しい文章>')
  console.error('例: npx tsx src/scripts/fixQuestionById.ts e5-159 "[貧|ひん]しい生活を送りました。"')
  process.exit(1)
}

const targetId = args[0]
let newSentence = args[1]

// シェルによって挿入された ' < /dev/null | ' を '|' に戻す
newSentence = newSentence.replace(/ < \/dev\/null \| /g, '|')

// questionsディレクトリのパス
const questionsDir = path.join(__dirname, '..', 'data', 'questions')

// バリデーション用のデータを読み込む
const { kanjiReadings, compoundReadings } = loadReadingData()
const gradeKanjiMap = getGradeKanjiList()
const allKanjiSet = getAllKanjiSet(gradeKanjiMap)

// 全ての問題ファイルを検索
let found = false
const files = fs.readdirSync(questionsDir).filter((file) => file.startsWith('questions-') && file.endsWith('.json'))

for (const file of files) {
  const filePath = path.join(questionsDir, file)
  const content = fs.readFileSync(filePath, 'utf-8')

  try {
    const data: QuestionsFile = JSON.parse(content)

    // 対象のIDを検索
    const questionIndex = data.questions.findIndex((q) => q.id === targetId)

    if (questionIndex !== -1) {
      console.log(`\n✅ ID "${targetId}" を ${file} で発見しました`)
      console.log('\n変更前:')
      console.log(`  ID: ${data.questions[questionIndex].id}`)
      console.log(`  文章: ${data.questions[questionIndex].sentence}`)

      // ファイル名から学年を判定
      const targetGrade = getTargetGradeFromFileName(file)

      // 新しい文章のバリデーション
      const validationErrors = validateQuestionWithGrade(newSentence, targetGrade, kanjiReadings, compoundReadings, gradeKanjiMap, allKanjiSet)

      if (validationErrors.length > 0) {
        console.error('\n❌ バリデーションエラー:')
        for (const error of validationErrors) {
          console.error(`  ・${error}`)
        }
        console.error('\n修正が中止されました。')
        process.exit(1)
      }

      // 文章を更新
      data.questions[questionIndex].sentence = newSentence

      console.log('\n変更後:')
      console.log(`  ID: ${data.questions[questionIndex].id}`)
      console.log(`  文章: ${data.questions[questionIndex].sentence}`)

      // ファイルに書き戻す
      fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')

      console.log(`\n✅ ${file} を更新しました`)
      found = true
      break
    }
  } catch (error) {
    console.error(`❌ ${file} の処理中にエラーが発生しました:`, error)
  }
}

if (!found) {
  console.error(`\n❌ ID "${targetId}" が見つかりませんでした`)
  process.exit(1)
}
