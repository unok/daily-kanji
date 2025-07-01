import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
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

interface KanjiReading {
  [key: string]: string[]
}

interface CompoundReading {
  [key: string]: string[]
}

interface ValidationResult {
  file: string
  errors: ProblemError[]
}

interface ProblemError {
  questionIndex: number
  sentence: string
  errors: string[]
}

interface KanjiUsage {
  kanji: string
  count: number
  locations: string[]
}

// 問題ファイルのリストを動的に取得
function getQuestionFiles(): string[] {
  const questionsDir = join(__dirname, '../data/questions')
  const files = readdirSync(questionsDir)
  return files.filter((file) => file.startsWith('questions-') && file.endsWith('.json')).sort() // ファイル名順にソート
}

// 各学年の漢字リストを取得
function getGradeKanjiList(): Map<number, Set<string>> {
  const gradeKanjiMap = new Map<number, Set<string>>()

  // education-kanji.tsからデータを読み込む
  const educationKanjiPath = join(__dirname, '../data/kanji-lists/education-kanji.ts')
  const educationKanjiContent = readFileSync(educationKanjiPath, 'utf-8')

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
  const jouyouKanjiPath = join(__dirname, '../data/kanji-lists/jouyou-kanji.ts')
  const jouyouKanjiContent = readFileSync(jouyouKanjiPath, 'utf-8')

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
  question: Question,
  _index: number,
  fileName: string,
  kanjiReadings: KanjiReading,
  compoundReadings: CompoundReading,
  gradeKanjiMap: Map<number, Set<string>>,
  allKanjiSet: Set<string>
): string[] {
  const errors: string[] = []
  const { sentence } = question

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
    const nonKanji = inputText.match(/[^\u4E00-\u9FAF]/g)
    if (nonKanji) {
      errors.push(`入力項目に漢字以外が含まれています: "${inputText}" (${nonKanji.join('')})`)
    }
  }

  // 9. 入力漢字の学年適合性チェック
  // ファイル名から学年を推定
  let targetGrade = 7 // デフォルトは中学校
  if (fileName.includes('elementary')) {
    const gradeMatch = fileName.match(/elementary(\d+)/)
    if (gradeMatch) {
      targetGrade = Number.parseInt(gradeMatch[1])
    }
  }

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

// 読み仮名を生成
function _generateReading(sentence: string, kanjiReadings: KanjiReading): string {
  let reading = ''

  for (const char of sentence) {
    if (kanjiReadings[char]) {
      reading += kanjiReadings[char][0]
    } else if (char.match(/[\u3040-\u309F]/)) {
      reading += char
    } else if (char.match(/[\u30A0-\u30FF]/)) {
      reading += char
    } else if (char === '、' || char === '。' || char === '？' || char === '！') {
      reading += char
    }
  }

  return reading
}

// メイン処理
function main() {
  // 漢字読みデータを読み込む
  const kanjiReadingsPath = join(__dirname, '../data/kanji-readings/kanji-readings.json')
  const kanjiReadings: KanjiReading = JSON.parse(readFileSync(kanjiReadingsPath, 'utf-8'))

  // 複合語の読みデータも読み込む
  const compoundReadingsPath = join(__dirname, '../data/kanji-readings/compound-readings.json')
  const compoundReadings: CompoundReading = JSON.parse(readFileSync(compoundReadingsPath, 'utf-8'))

  // 学年別漢字リストを取得
  const gradeKanjiMap = getGradeKanjiList()
  const allKanjiSet = getAllKanjiSet(gradeKanjiMap)

  // 漢字使用頻度を記録
  const kanjiUsageMap = new Map<string, KanjiUsage>()
  for (const kanji of allKanjiSet) {
    kanjiUsageMap.set(kanji, { kanji, count: 0, locations: [] })
  }

  // 各ファイルを検証
  const allResults: ValidationResult[] = []
  let totalErrors = 0
  const questionFiles = getQuestionFiles()

  console.log(`\n検証対象ファイル数: ${questionFiles.length}`)

  for (const fileName of questionFiles) {
    const filePath = join(__dirname, `../data/questions/${fileName}`)
    const fileData = JSON.parse(readFileSync(filePath, 'utf-8'))

    const questions: Question[] = fileData.questions || fileData

    const errors: ProblemError[] = []

    questions.forEach((question, index) => {
      // 問題の検証
      const questionErrors = validateQuestion(question, index, fileName, kanjiReadings, compoundReadings, gradeKanjiMap, allKanjiSet)

      if (questionErrors.length > 0) {
        errors.push({
          questionIndex: index,
          sentence: question.sentence,
          errors: questionErrors,
        })
        totalErrors += questionErrors.length
      }

      // 漢字使用頻度を更新
      // [漢字|読み]形式から漢字部分だけを抽出
      const kanjiFromBrackets: string[] = []
      const bracketMatches = question.sentence.matchAll(/\[([^|\]]+)\|[^\]]+\]/g)
      for (const match of bracketMatches) {
        const kanjiInBracket = extractKanji(match[1])
        kanjiFromBrackets.push(...kanjiInBracket)
      }

      // 通常のテキストからも漢字を抽出
      const sentenceWithoutBrackets = question.sentence.replace(/\[[^|\]]+\|[^\]]+\]/g, '')
      const kanjiFromText = extractKanji(sentenceWithoutBrackets)

      // 両方を結合して重複を排除
      const uniqueKanji = new Set([...kanjiFromBrackets, ...kanjiFromText])

      for (const kanji of uniqueKanji) {
        if (kanjiUsageMap.has(kanji)) {
          const usage = kanjiUsageMap.get(kanji)
          if (usage) {
            usage.count++
            usage.locations.push(`${fileName} #${index}: ${question.sentence}`)
          }
        }
      }
    })

    if (errors.length > 0) {
      allResults.push({ file: fileName, errors })
    }
  }

  // 結果を表示
  console.log('=== 漢字学習システム 包括的検証結果 ===\n')

  if (allResults.length === 0) {
    console.log('✅ すべての問題が検証をパスしました！\n')
  } else {
    console.log(`❌ ${totalErrors}個のエラーが見つかりました\n`)

    for (const result of allResults) {
      console.log(`\n📁 ${result.file}`)
      console.log('─'.repeat(60))

      for (const error of result.errors) {
        console.log(`\n問題 #${error.questionIndex}`)
        console.log(`文章: ${error.sentence}`)
        console.log('エラー:')
        for (const e of error.errors) {
          console.log(`  ・${e}`)
        }
      }
    }
  }

  // 全体統計を表示
  console.log('\n\n=== 漢字使用頻度統計 ===\n')

  // 使用頻度でソート
  const sortedUsage = Array.from(kanjiUsageMap.values()).sort((a, b) => a.count - b.count)

  // 0回使用の漢字
  const unusedKanji = sortedUsage.filter((u) => u.count === 0)

  if (unusedKanji.length > 0) {
    console.log(`\n❌ 全く使われていない漢字（${unusedKanji.length}字）:`)
    const unusedKanjiStr = unusedKanji.map((u) => u.kanji)
    // 20文字ずつ表示
    for (let i = 0; i < unusedKanjiStr.length; i += 20) {
      console.log(unusedKanjiStr.slice(i, i + 20).join(''))
    }
  }

  // 5回未満の漢字を使用回数でグループ化
  const lowFreqByCount = new Map<number, string[]>()
  for (const usage of sortedUsage) {
    if (usage.count > 0 && usage.count < 5) {
      if (!lowFreqByCount.has(usage.count)) {
        lowFreqByCount.set(usage.count, [])
      }
      lowFreqByCount.get(usage.count)?.push(usage.kanji)
    }
  }

  const totalLowFreq = Array.from(lowFreqByCount.values()).reduce((sum, arr) => sum + arr.length, 0)
  if (totalLowFreq > 0) {
    console.log(`\n⚠️  5回未満しか使われていない漢字（${totalLowFreq}字）:\n`)

    // 使用回数順（1回、2回、3回、4回）で表示
    for (let count = 1; count <= 4; count++) {
      const kanjiList = lowFreqByCount.get(count)
      if (kanjiList && kanjiList.length > 0) {
        const needed = 5 - count
        console.log(`【${count}回使用（あと${needed}回必要）】${kanjiList.length}字`)
        // 20文字ずつ表示
        for (let i = 0; i < kanjiList.length; i += 20) {
          console.log(kanjiList.slice(i, i + 20).join(''))
        }
        console.log('')
      }
    }
  }

  // サマリー
  const wellUsedKanji = sortedUsage.filter((u) => u.count >= 5)
  const underusedKanji = sortedUsage.filter((u) => u.count > 0 && u.count < 5)
  console.log('\n\n=== サマリー ===')
  console.log(`全漢字数: ${allKanjiSet.size}字`)
  console.log(`5回以上使用: ${wellUsedKanji.length}字（${((wellUsedKanji.length / allKanjiSet.size) * 100).toFixed(1)}%）`)
  console.log(`5回未満使用: ${underusedKanji.length}字（${((underusedKanji.length / allKanjiSet.size) * 100).toFixed(1)}%）`)
  console.log(`未使用: ${unusedKanji.length}字（${((unusedKanji.length / allKanjiSet.size) * 100).toFixed(1)}%）`)
}

// 実行
main()
