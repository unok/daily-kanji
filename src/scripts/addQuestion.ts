import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface Question {
  id: string
  sentence: string
}

interface QuestionData {
  questions: Question[]
}

async function addQuestion(grade: string, sentence: string): Promise<void> {
  const dataDir = path.join(__dirname, '../data/questions')

  // グレードに応じたファイル名のプレフィックスを設定
  let filePrefix: string
  let idPrefix: string

  switch (grade) {
    case '1':
      filePrefix = 'questions-elementary1-part'
      idPrefix = 'e1'
      break
    case '2':
      filePrefix = 'questions-elementary2-part'
      idPrefix = 'e2'
      break
    case '3':
      filePrefix = 'questions-elementary3-part'
      idPrefix = 'e3'
      break
    case '4':
      filePrefix = 'questions-elementary4-part'
      idPrefix = 'e4'
      break
    case '5':
      filePrefix = 'questions-elementary5-part'
      idPrefix = 'e5'
      break
    case '6':
      filePrefix = 'questions-elementary6-part'
      idPrefix = 'e6'
      break
    case 'junior':
      filePrefix = 'questions-junior-part'
      idPrefix = 'jun'
      break
    default:
      throw new Error(`無効なグレード: ${grade}. 1-6 または junior を指定してください。`)
  }

  // 該当グレードの全ファイルを取得
  const files = await fs.readdir(dataDir)
  const targetFiles = files.filter((file) => file.startsWith(filePrefix) && file.endsWith('.json'))

  if (targetFiles.length === 0) {
    throw new Error(`グレード ${grade} のファイルが見つかりません。`)
  }

  // 各ファイルの行数と既存のIDを収集
  let minLineCount = Number.POSITIVE_INFINITY
  let targetFile = ''
  const existingIds = new Set<string>()

  for (const file of targetFiles) {
    const filePath = path.join(dataDir, file)
    const content = await fs.readFile(filePath, 'utf-8')
    const data: QuestionData = JSON.parse(content)

    // 既存のIDを収集
    for (const q of data.questions) {
      existingIds.add(q.id)
    }

    // 行数をカウント（改行文字で分割）
    const lineCount = content.split('\n').length

    if (lineCount < minLineCount) {
      minLineCount = lineCount
      targetFile = file
    }
  }

  // 新しいIDを生成（重複しない番号を探す）
  let newId: string
  let idNumber = 1

  while (true) {
    newId = `${idPrefix}-${idNumber.toString().padStart(3, '0')}`
    if (!existingIds.has(newId)) {
      break
    }
    idNumber++
  }

  // ターゲットファイルに問題を追加
  const targetFilePath = path.join(dataDir, targetFile)
  const content = await fs.readFile(targetFilePath, 'utf-8')
  const data: QuestionData = JSON.parse(content)

  // 新しい問題を追加
  const newQuestion: Question = {
    id: newId,
    sentence: sentence,
  }

  data.questions.push(newQuestion)

  // ファイルに書き込み（整形して保存）
  await fs.writeFile(targetFilePath, `${JSON.stringify(data, null, 2)}\n`)

  console.log('問題を追加しました:')
  console.log(`- ファイル: ${targetFile}`)
  console.log(`- ID: ${newId}`)
  console.log(`- 文章: ${sentence}`)
}

// コマンドライン引数から実行
async function main() {
  const args = process.argv.slice(2)

  if (args.length !== 2) {
    console.error('使用方法: npx tsx src/scripts/addQuestion.ts <grade> "<sentence>"')
    console.error('例: npx tsx src/scripts/addQuestion.ts 1 "[本|ほん]を読みました。"')
    console.error('例: npx tsx src/scripts/addQuestion.ts junior "[憂|ゆう]鬱な気分になりました。"')
    process.exit(1)
  }

  const [grade, sentenceArg] = args

  // シェルによって挿入された ' < /dev/null | ' を '|' に戻す
  const sentence = sentenceArg.replace(/ < \/dev\/null \| /g, '|')

  try {
    await addQuestion(grade, sentence)
  } catch (error) {
    console.error('エラー:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
