// biome-ignore lint/suspicious/noConsole: This is a validation script
import { readdirSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const questionsDir = join(__dirname, '../data/questions')

// JSONファイルから直接IDをカウント
function countIdsInFiles(): Map<string, number> {
  const gradeCounts = new Map<string, number>()
  const files = readdirSync(questionsDir)

  const grades = ['elementary1', 'elementary2', 'elementary3', 'elementary4', 'elementary5', 'elementary6', 'junior', 'senior']

  for (const grade of grades) {
    let count = 0
    const gradeFiles = files.filter((f) => f.includes(`${grade}-part`) && f.endsWith('.json'))

    for (const file of gradeFiles) {
      const content = readFileSync(join(questionsDir, file), 'utf8')
      const matches = content.match(/"id":/g)
      if (matches) {
        count += matches.length
      }
    }

    gradeCounts.set(grade, count)
  }

  return gradeCounts
}

// validateAllRequirements.tsのloadQuestions関数を使用
function loadQuestions(grade: string): any[] {
  try {
    const questionsDir = join(__dirname, '../data/questions')
    const files = readdirSync(questionsDir)
    const matchingFiles = files.filter((file) => file.includes(`${grade}-part`) && file.endsWith('.json'))

    if (matchingFiles.length === 0) {
      throw new Error(`No question files found for grade: ${grade}`)
    }

    const allQuestions: any[] = []

    matchingFiles.sort().forEach((file) => {
      const filePath = join(questionsDir, file)
      const data = JSON.parse(readFileSync(filePath, 'utf8'))
      if (data.questions) {
        allQuestions.push(...data.questions)
      }
    })

    return allQuestions
  } catch (error) {
    console.error(`Error loading questions for grade ${grade}:`, error)
    return []
  }
}

// 読み込まれた問題数をカウント
function countLoadedQuestions(): Map<string, number> {
  const gradeCounts = new Map<string, number>()
  const grades = ['elementary1', 'elementary2', 'elementary3', 'elementary4', 'elementary5', 'elementary6', 'junior', 'senior']

  for (const grade of grades) {
    const questions = loadQuestions(grade)
    gradeCounts.set(grade, questions.length)
  }

  return gradeCounts
}

// メイン処理
console.log('🔍 JSONファイルのIDカウントと読み込まれたIDカウントの比較')
console.log('==================================================\n')

const fileCounts = countIdsInFiles()
const loadedCounts = countLoadedQuestions()

let hasDiscrepancy = false

for (const [grade, fileCount] of fileCounts) {
  const loadedCount = loadedCounts.get(grade) || 0
  const match = fileCount === loadedCount

  if (!match) {
    hasDiscrepancy = true
  }

  console.log(`${match ? '✅' : '❌'} ${grade}:`)
  console.log(`   JSONファイル内のID数: ${fileCount}`)
  console.log(`   読み込まれた問題数: ${loadedCount}`)
  if (!match) {
    console.log(`   差分: ${fileCount - loadedCount}`)
  }
  console.log()
}

console.log('==================================================')
console.log(hasDiscrepancy ? '❌ 不一致があります' : '✅ すべて一致しています')
