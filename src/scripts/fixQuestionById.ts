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

interface KanjiReading {
  [key: string]: string[]
}

interface CompoundReading {
  [key: string]: string[]
}

// 各学年の漢字リストを取得
function getGradeKanjiList(): Map<number, Set<string>> {
  const gradeKanjiMap = new Map<number, Set<string>>()

  // education-kanji.tsからデータを読み込む
  const educationKanjiPath = path.join(__dirname, '../data/kanji-lists/education-kanji.ts')
  const educationKanjiContent = fs.readFileSync(educationKanjiPath, 'utf-8')

  // EDUCATION_KANJIオブジェクトを抽出
  const educationKanjiMatch = educationKanjiContent.match(/export const EDUCATION_KANJI = ({[\s\S]*?})\s*\n\s*export/m)
  if (!educationKanjiMatch) {
    throw new Error('EDUCATION_KANJIが見つかりません')
  }

  // evalを使わずに安全にパース
  const educationKanjiStr = educationKanjiMatch[1]

  // 各学年のデータを抽出（1-6年）
  for (let grade = 1; grade <= 6; grade++) {
    const gradeRegex = new RegExp(`${grade}:\\s*\\[([\\s\\S]*?)\\](?:,|\\s*})`, 'm')
    const gradeMatch = educationKanjiStr.match(gradeRegex)
    if (gradeMatch) {
      const kanjiArrayStr = gradeMatch[1]
      const kanjiList = kanjiArrayStr.match(/'([^']+)'/g)?.map((k) => k.slice(1, -1)) || []
      gradeKanjiMap.set(grade, new Set(kanjiList))
    }
  }

  // jouyou-kanji.tsから中学校の漢字を読み込む
  const jouyouKanjiPath = path.join(__dirname, '../data/kanji-lists/jouyou-kanji.ts')
  const jouyouKanjiContent = fs.readFileSync(jouyouKanjiPath, 'utf-8')

  // MIDDLE_SCHOOL_KANJIを抽出
  const juniorKanjiMatch = jouyouKanjiContent.match(/export const MIDDLE_SCHOOL_KANJI = \[([\s\S]*?)\]/m)
  if (!juniorKanjiMatch) {
    throw new Error('MIDDLE_SCHOOL_KANJIが見つかりません')
  }

  const juniorKanjiStr = juniorKanjiMatch[1]
  const juniorKanjiList = juniorKanjiStr.match(/'([^']+)'/g)?.map((k) => k.slice(1, -1)) || []
  gradeKanjiMap.set(7, new Set(juniorKanjiList))

  return gradeKanjiMap
}

// 全学年の漢字リストを取得
function getAllKanjiSet(gradeKanjiMap: Map<number, Set<string>>): Set<string> {
  const allKanji = new Set<string>()
  for (const kanjiSet of gradeKanjiMap.values()) {
    for (const kanji of kanjiSet) {
      allKanji.add(kanji)
    }
  }
  return allKanji
}

// 漢字の学年を判定
function getKanjiGrade(kanji: string, gradeKanjiMap: Map<number, Set<string>>): number {
  for (const [grade, kanjiSet] of gradeKanjiMap) {
    if (kanjiSet.has(kanji)) {
      return grade
    }
  }
  return 0 // 学習漢字でない
}

// 文章から漢字を抽出
function extractKanji(text: string): string[] {
  // 通常の漢字範囲 + CJK拡張Bの𠮟を含む範囲
  return text.match(/[\u4E00-\u9FAF\u{20000}-\u{2A6DF}]/gu) || []
}

// 文章を入力付き形式から通常形式に変換
function parseSentence(sentence: string): { plainSentence: string; inputs: string[]; reading: string } {
  const inputs: string[] = []
  let plainSentence = sentence
  let reading = ''

  // [漢字|よみ]形式をパース
  const matches = sentence.matchAll(/\[([^|\]]+)\|([^\]]+)\]/g)
  const allMatches = Array.from(matches)

  // 逆順で置換（インデックスがずれないように）
  for (let i = allMatches.length - 1; i >= 0; i--) {
    const match = allMatches[i]
    const [fullMatch, kanji, _yomi] = match
    inputs.unshift(kanji)
    if (match.index !== undefined) {
      plainSentence = `${plainSentence.substring(0, match.index)}[]${plainSentence.substring(match.index + fullMatch.length)}`
    }
  }

  // 読みを生成（[漢字|よみ]から読みを抽出）
  let tempSentence = sentence
  while (tempSentence.includes('[')) {
    const match = tempSentence.match(/\[([^|\]]+)\|([^\]]+)\]/)
    if (!match) break
    const [fullMatch, _kanji, yomi] = match
    tempSentence = tempSentence.replace(fullMatch, yomi)
  }
  reading = tempSentence

  return { plainSentence, inputs, reading }
}

// 問題単位の検証
function validateQuestion(
  sentence: string,
  targetGrade: number,
  kanjiReadings: KanjiReading,
  compoundReadings: CompoundReading,
  gradeKanjiMap: Map<number, Set<string>>,
  allKanjiSet: Set<string>
): string[] {
  const errors: string[] = []

  // 文章をパース
  const { plainSentence, inputs } = parseSentence(sentence)

  // 入力部分の抽出（読みチェック用）
  const inputMatches = [...sentence.matchAll(/\[([^|]+)\|[^\]]+\]/g)]

  // 1. 文章の長さチェック（9文字以上）
  if (plainSentence.length < 9) {
    errors.push(`文章が短すぎます（${plainSentence.length}文字）: 9文字以上必要`)
  }

  // 2. 漢字重複チェック（入力項目の漢字が文章の他の部分に出現しているかチェック）
  // まず文章全体の漢字を取得（他のチェックで使用するため）
  const kanjiArray = extractKanji(plainSentence)
  const kanjiSet = new Set(kanjiArray)

  // 入力項目の漢字を収集
  const inputKanjiSet = new Set<string>()
  for (const inputText of inputs) {
    const inputKanji = extractKanji(inputText)
    for (const kanji of inputKanji) {
      inputKanjiSet.add(kanji)
    }
  }

  // 文章全体から入力項目の位置を特定し、それ以外の部分で入力項目の漢字が使われているかチェック
  if (inputKanjiSet.size > 0) {
    // 元の文章を使って入力項目以外の部分を取得
    let nonInputText = sentence
    // [漢字|よみ]形式を一時的なプレースホルダーに置換
    const inputMatches = Array.from(sentence.matchAll(/\[([^|\]]+)\|([^\]]+)\]/g))
    for (let i = inputMatches.length - 1; i >= 0; i--) {
      const match = inputMatches[i]
      if (match.index !== undefined) {
        nonInputText = `${nonInputText.substring(0, match.index)}◯${nonInputText.substring(match.index + match[0].length)}`
      }
    }

    // プレースホルダー以外の部分から漢字を抽出
    const nonInputKanji = extractKanji(nonInputText.replace(/◯/g, ''))

    // 入力項目の漢字が他の部分に出現しているかチェック
    const duplicates: string[] = []
    for (const inputKanji of inputKanjiSet) {
      if (nonInputKanji.includes(inputKanji)) {
        duplicates.push(inputKanji)
      }
    }

    if (duplicates.length > 0) {
      errors.push(`漢字が重複しています: ${duplicates.join(', ')}`)
    }
  }

  // 3. 常用漢字チェック（文章全体）
  for (const kanji of kanjiSet) {
    if (!allKanjiSet.has(kanji)) {
      errors.push(`常用漢字ではありません: ${kanji}`)
    }
  }

  // 4. 読みデータの存在チェック
  for (const kanji of kanjiSet) {
    if (!kanjiReadings[kanji]) {
      errors.push(`読みデータが存在しません: ${kanji}`)
    }
  }

  // 5. 読みの正確性チェック
  const readingErrors: string[] = []

  for (const match of inputMatches) {
    const kanjiPart = match[1]
    const readingPart = match[0].match(/\|([^\]]+)\]/)?.[1] || ''

    // 複合語の読みをチェック
    if (kanjiPart.length > 1 && compoundReadings[kanjiPart]) {
      const validReadings = compoundReadings[kanjiPart]
      if (!validReadings.includes(readingPart)) {
        readingErrors.push(`[${kanjiPart}|${readingPart}] - 正しい読み: ${validReadings.join('、')}`)
      }
      continue
    }

    // 単漢字の読みをチェック
    if (kanjiPart.length === 1) {
      const kanji = kanjiPart
      if (!kanjiReadings[kanji]) {
        readingErrors.push(`${kanji}の読みデータなし`)
      } else {
        const validReadings = kanjiReadings[kanji]
        if (!validReadings.includes(readingPart)) {
          // 送り仮名を含む場合も考慮
          let isValid = false
          for (const reading of validReadings) {
            if (readingPart.startsWith(reading)) {
              isValid = true
              break
            }
          }
          if (!isValid) {
            readingErrors.push(`[${kanjiPart}|${readingPart}] - 正しい読み: ${validReadings.join('、')}`)
          }
        }
      }
    }
  }

  if (readingErrors.length > 0) {
    errors.push(`読み誤り: ${readingErrors.join('; ')}`)
  }

  // 6. 入力項目数チェック（2個以下）
  const inputCount = inputs.length
  if (inputCount > 2) {
    errors.push(`入力項目が多すぎます（${inputCount}個）: 2個以下にしてください`)
  }

  // 7. 入力項目の連続性チェック
  if (plainSentence.includes('[][]')) {
    errors.push('入力項目が連続しています')
  }

  // 8. 入力項目の文字種チェック（漢字のみ）
  for (const inputText of inputs) {
    // 通常の漢字範囲 + CJK拡張Bの𠮟を含む範囲
    const nonKanji = inputText.match(/[^\u4E00-\u9FAF\u{20000}-\u{2A6DF}]/gu)
    if (nonKanji) {
      errors.push(`入力項目に漢字以外が含まれています: "${inputText}" (${nonKanji.join('')})`)
    }
  }

  // 9. 入力漢字の学年適合性チェック
  for (const inputText of inputs) {
    const inputKanji = extractKanji(inputText)
    for (const kanji of inputKanji) {
      const kanjiGrade = getKanjiGrade(kanji, gradeKanjiMap)
      if (kanjiGrade === 0) {
        errors.push(`入力漢字が学習漢字ではありません: ${kanji}`)
      } else if (kanjiGrade !== targetGrade) {
        errors.push(`入力漢字の学年が不適切: ${kanji} (${kanjiGrade}年生) → ${targetGrade}年生の問題`)
      }
    }
  }

  // 10. 文章全体の学年適合性チェック
  for (const kanji of kanjiSet) {
    const kanjiGrade = getKanjiGrade(kanji, gradeKanjiMap)
    if (kanjiGrade === 0) {
      errors.push(`学習漢字ではありません: ${kanji}`)
    } else if (kanjiGrade > targetGrade) {
      errors.push(`より高学年の漢字が使われています: ${kanji} (${kanjiGrade}年生)`)
    }
  }

  // 11. 文法・表現の誤用チェック
  const grammarErrors: string[] = []

  if (sentence.includes('ありています')) {
    grammarErrors.push('「ありています」は誤用（「あります」が正しい）')
  }

  if (sentence.includes('なのです')) {
    grammarErrors.push('「なのです」が不自然')
  }

  if (sentence.includes('いなのです')) {
    grammarErrors.push('「いなのです」は文法的に誤り')
  }

  if (sentence.includes('てきました') && !sentence.includes('してきました')) {
    // 「見てきました」「来てきました」など自然なものは除外
    if (!sentence.match(/[見来行帰戻持連運送]/)) {
      grammarErrors.push('「てきました」の使い方が不自然な可能性')
    }
  }

  // 不自然に長くなった文章を検出
  if (sentence.includes('ことができます')) {
    const base = sentence.replace('ことができます。', '')
    if (!(base.includes('する') || base.includes('できる'))) {
      grammarErrors.push('「ことができます」が不自然')
    }
  }

  if (grammarErrors.length > 0) {
    errors.push(...grammarErrors)
  }

  return errors
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
const kanjiReadingsPath = path.join(__dirname, '../data/kanji-readings/kanji-readings.json')
const kanjiReadings: KanjiReading = JSON.parse(fs.readFileSync(kanjiReadingsPath, 'utf-8'))

const compoundReadingsPath = path.join(__dirname, '../data/kanji-readings/compound-readings.json')
const compoundReadings: CompoundReading = JSON.parse(fs.readFileSync(compoundReadingsPath, 'utf-8'))

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
      const validationErrors = validateQuestion(newSentence, targetGrade, kanjiReadings, compoundReadings, gradeKanjiMap, allKanjiSet)

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
