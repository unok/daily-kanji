import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface Question {
  id: string
  sentence: string
}

interface QuestionsFile {
  questions: Question[]
}

// コマンドライン引数を取得
const args = process.argv.slice(2)
if (args.length !== 1) {
  console.error('使用方法: npx tsx src/scripts/deleteQuestionById.ts <ID>')
  console.error('例: npx tsx src/scripts/deleteQuestionById.ts e5-159')
  process.exit(1)
}

const targetId = args[0]

// questionsディレクトリのパス
const questionsDir = path.join(__dirname, '..', 'data', 'questions')

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
      console.log('\n削除対象:')
      console.log(`  ID: ${data.questions[questionIndex].id}`)
      console.log(`  文章: ${data.questions[questionIndex].sentence}`)

      // 削除前の問題数
      const beforeCount = data.questions.length

      // 問題を削除
      data.questions.splice(questionIndex, 1)

      // 削除後の問題数
      const afterCount = data.questions.length

      console.log(`\n問題数: ${beforeCount} → ${afterCount}`)

      // ファイルに書き戻す
      fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')

      console.log(`\n✅ ${file} から問題を削除しました`)
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
