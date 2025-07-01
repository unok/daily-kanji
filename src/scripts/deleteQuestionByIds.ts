import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface Question {
  id: string
  sentence: string
  reading?: string
  modifier?: string
  options?: string[]
  answer?: number
  elementary?: number
  junior?: number
}

// IDリストをファイルまたは標準入力から読み込む
function readIdList(filePath?: string): Promise<string[]> {
  if (filePath) {
    // ファイルから読み込み
    const content = readFileSync(filePath, 'utf-8')
    return Promise.resolve(
      content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    )
  }
  // 標準入力から読み込み
  console.log('IDを入力してください（空行で終了）:')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const ids: string[] = []

  return new Promise((resolve) => {
    rl.on('line', (line) => {
      const trimmed = line.trim()
      if (trimmed === '') {
        rl.close()
        resolve(ids)
      } else {
        ids.push(trimmed)
      }
    })
  })
}

// 問題ファイルのリストを動的に取得
function getQuestionFiles(): string[] {
  const questionsDir = join(__dirname, '../data/questions')
  const files = readdirSync(questionsDir)
  return files.filter((file) => file.startsWith('questions-') && file.endsWith('.json')).sort()
}

// IDから該当する問題を検索
function findQuestionsByIds(targetIds: string[]): Map<string, { file: string; question: Question; index: number }> {
  const foundQuestions = new Map<string, { file: string; question: Question; index: number }>()
  const notFoundIds = new Set(targetIds)

  const questionFiles = getQuestionFiles()

  for (const fileName of questionFiles) {
    const filePath = join(__dirname, `../data/questions/${fileName}`)
    const fileData = JSON.parse(readFileSync(filePath, 'utf-8'))
    const questions: Question[] = fileData.questions || fileData

    questions.forEach((question, index) => {
      if (targetIds.includes(question.id)) {
        foundQuestions.set(question.id, {
          file: fileName,
          question,
          index,
        })
        notFoundIds.delete(question.id)
      }
    })
  }

  // 見つからなかったIDを報告
  if (notFoundIds.size > 0) {
    console.log('\n⚠️  以下のIDは見つかりませんでした:')
    for (const id of notFoundIds) {
      console.log(`  - ${id}`)
    }
  }

  return foundQuestions
}

// 削除対象の問題を表示
function displayQuestionsToDelete(questionsMap: Map<string, { file: string; question: Question; index: number }>) {
  console.log('\n削除対象の問題:')
  console.log('='.repeat(80))

  // ファイルごとにグループ化
  const byFile = new Map<string, Array<{ question: Question; index: number }>>()

  for (const [_id, data] of questionsMap) {
    if (!byFile.has(data.file)) {
      byFile.set(data.file, [])
    }
    byFile.get(data.file)?.push({ question: data.question, index: data.index })
  }

  // ファイルごとに表示
  for (const [fileName, questions] of byFile) {
    console.log(`\n📁 ${fileName} (${questions.length}問)`)
    console.log('-'.repeat(60))

    // インデックス順にソート
    questions.sort((a, b) => a.index - b.index)

    for (const { question } of questions) {
      console.log(`  ID: ${question.id}`)
      console.log(`  文: ${question.sentence}`)
    }
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log(`合計: ${questionsMap.size}問`)
}

// 問題を削除
function deleteQuestions(questionsMap: Map<string, { file: string; question: Question; index: number }>) {
  // ファイルごとに削除処理
  const byFile = new Map<string, Set<string>>()

  for (const [id, data] of questionsMap) {
    if (!byFile.has(data.file)) {
      byFile.set(data.file, new Set())
    }
    byFile.get(data.file)?.add(id)
  }

  let totalDeleted = 0

  for (const [fileName, idsToDelete] of byFile) {
    const filePath = join(__dirname, `../data/questions/${fileName}`)
    const fileData = JSON.parse(readFileSync(filePath, 'utf-8'))
    const questions: Question[] = fileData.questions || fileData

    // 削除対象でない問題だけを残す
    const remainingQuestions = questions.filter((q) => !idsToDelete.has(q.id))

    const deletedCount = questions.length - remainingQuestions.length
    totalDeleted += deletedCount

    // ファイルを更新
    const updatedData = {
      ...fileData,
      questions: remainingQuestions,
    }

    writeFileSync(filePath, `${JSON.stringify(updatedData, null, 2)}\n`)
    console.log(`✅ ${fileName}: ${deletedCount}問削除`)
  }

  console.log(`\n合計 ${totalDeleted}問を削除しました。`)
}

// 確認プロンプト
function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

// メイン処理
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.log('使用方法:')
    console.log('  npx tsx deleteQuestionByIds.ts [IDリストファイル]')
    console.log('  cat id-list.txt | npx tsx deleteQuestionByIds.ts')
    console.log('\nオプション:')
    console.log('  --help, -h    このヘルプを表示')
    process.exit(0)
  }

  try {
    // IDリストを読み込む
    const idFilePath = args[0]
    const ids = await readIdList(idFilePath)

    if (ids.length === 0) {
      console.log('削除するIDが指定されていません。')
      process.exit(0)
    }

    console.log(`\n${ids.length}個のIDを読み込みました。`)

    // 問題を検索
    const questionsMap = findQuestionsByIds(ids)

    if (questionsMap.size === 0) {
      console.log('削除対象の問題が見つかりませんでした。')
      process.exit(0)
    }

    // 削除対象を表示
    displayQuestionsToDelete(questionsMap)

    // 確認
    const shouldDelete = await confirm('\nこれらの問題を削除しますか？ (y/n): ')

    if (shouldDelete) {
      deleteQuestions(questionsMap)
    } else {
      console.log('削除をキャンセルしました。')
    }
  } catch (error) {
    console.error('エラーが発生しました:', error)
    process.exit(1)
  }
}

// 実行
main()
