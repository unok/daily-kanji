import { promises as fs } from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { GRADES, type GradeKey, getGradeNumber } from '../../utils/constants.js'
import { getAllKanjiSet, getGradeKanjiList, loadReadingData, type Question, validateQuestionWithGrade } from './validation.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(dirname(__filename))

interface QuestionData {
  questions: Question[]
}

interface GradeConfig {
  filePrefix: string
  idPrefix: string
  targetGradeNum: number
}

// グレード設定を取得
export function getGradeConfig(grade: string): GradeConfig {
  const gradeInfo = GRADES.find((g) => g.key === grade)
  if (!gradeInfo) {
    throw new Error(`無効なグレード: ${grade}. 1-6 または junior を指定してください。`)
  }

  return {
    filePrefix: gradeInfo.filePrefix,
    idPrefix: gradeInfo.idPrefix,
    targetGradeNum: getGradeNumber(gradeInfo.key as GradeKey),
  }
}

// 共通の問題追加関数
export async function addQuestionToFile(
  grade: string,
  sentence: string,
  options?: {
    skipValidation?: boolean
    customValidation?: (sentence: string, targetGradeNum: number) => string[]
  }
): Promise<{ file: string; id: string; sentence: string }> {
  const dataDir = path.join(__dirname, '../data/questions')
  const { filePrefix, idPrefix, targetGradeNum } = getGradeConfig(grade)

  // バリデーション
  if (!options?.skipValidation) {
    let validationErrors: string[]

    if (options?.customValidation) {
      validationErrors = options.customValidation(sentence, targetGradeNum)
    } else {
      // デフォルトのバリデーション
      const { kanjiReadings, compoundReadings } = loadReadingData()
      const gradeKanjiMap = getGradeKanjiList()
      const allKanjiSet = getAllKanjiSet(gradeKanjiMap)
      validationErrors = validateQuestionWithGrade(sentence, targetGradeNum, kanjiReadings, compoundReadings, gradeKanjiMap, allKanjiSet)
    }

    if (validationErrors.length > 0) {
      console.error('❌ バリデーションエラー:')
      for (const error of validationErrors) {
        console.error(`  ・${error}`)
      }
      throw new Error('問題文が検証に失敗しました。')
    }
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

  // biome-ignore lint/suspicious/noConsole: スクリプトの出力として必要
  console.log('✅ 問題を追加しました:')
  // biome-ignore lint/suspicious/noConsole: スクリプトの出力として必要
  console.log(`- ファイル: ${targetFile}`)
  // biome-ignore lint/suspicious/noConsole: スクリプトの出力として必要
  console.log(`- ID: ${newId}`)
  // biome-ignore lint/suspicious/noConsole: スクリプトの出力として必要
  console.log(`- 文章: ${sentence}`)

  return { file: targetFile, id: newId, sentence }
}
