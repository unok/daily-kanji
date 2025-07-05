import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(dirname(dirname(__filename)))

export interface Question {
  id: string
  sentence: string
  reading?: string
  modifier?: string
  options?: string[]
  answer?: number
  elementary?: number
  junior?: number
}

export interface KanjiReading {
  [key: string]: string[]
}

export interface CompoundReading {
  [key: string]: string[]
}

// 各学年の漢字リストを取得
export function getGradeKanjiList(): Map<number, Set<string>> {
  const gradeKanjiMap = new Map<number, Set<string>>()

  // education-kanji.tsからデータを読み込む
  const educationKanjiPath = join(__dirname, 'data/kanji-lists/education-kanji.ts')
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
  const jouyouKanjiPath = join(__dirname, 'data/kanji-lists/jouyou-kanji.ts')
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
export function getAllKanjiSet(gradeKanjiMap: Map<number, Set<string>>): Set<string> {
  const allKanji = new Set<string>()
  for (const kanjiSet of gradeKanjiMap.values()) {
    for (const kanji of kanjiSet) {
      allKanji.add(kanji)
    }
  }
  return allKanji
}

// 漢字の学年を判定
export function getKanjiGrade(kanji: string, gradeKanjiMap: Map<number, Set<string>>): number {
  for (const [grade, kanjiSet] of gradeKanjiMap) {
    if (kanjiSet.has(kanji)) {
      return grade
    }
  }
  return 0 // 学習漢字でない
}

// 文章から漢字を抽出
export function extractKanji(text: string): string[] {
  // 通常の漢字範囲 + CJK拡張Bの𠮟を含む範囲
  return text.match(/[\u4E00-\u9FAF\u{20000}-\u{2A6DF}]/gu) || []
}

// 文章を入力付き形式から通常形式に変換
export function parseSentence(sentence: string): { plainSentence: string; inputs: string[]; reading: string } {
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
export function validateQuestion(
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
      for (const kanji of duplicates) {
        errors.push(`入力漢字「${kanji}」が文章内に重複しています`)
      }
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
      errors.push(`読みデータが存在しません: ${kanji} (読みが正しい場合は src/data/kanji-readings/kanji-readings.json に追加してください)`)
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
        readingErrors.push(
          `[${kanjiPart}|${readingPart}] - 正しい読み: ${validReadings.join('、')} (読みが正しい場合は src/data/kanji-readings/compound-readings.json に追加してください)`
        )
      }
      continue
    }

    // 単漢字の読みをチェック
    if (kanjiPart.length === 1) {
      const kanji = kanjiPart
      if (!kanjiReadings[kanji]) {
        readingErrors.push(`${kanji}の読みデータなし (読みが正しい場合は src/data/kanji-readings/kanji-readings.json に追加してください)`)
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
            readingErrors.push(
              `[${kanjiPart}|${readingPart}] - 正しい読み: ${validReadings.join('、')} (読みが正しい場合は src/data/kanji-readings/kanji-readings.json に追加してください)`
            )
          }
        }
      }
    }
  }

  if (readingErrors.length > 0) {
    errors.push(`読み誤り: ${readingErrors.join('; ')}`)
  }

  // ファイル名から学年を推定（後で使用するため先に定義）
  let targetGrade = 7 // デフォルトは中学校
  if (fileName.includes('elementary')) {
    const gradeMatch = fileName.match(/elementary(\d+)/)
    if (gradeMatch) {
      targetGrade = Number.parseInt(gradeMatch[1])
    }
  }

  // 6. 入力項目の存在チェック
  if (inputs.length === 0) {
    errors.push('入力項目がありません: [漢字|読み]形式の入力欄が必要です')
  }

  // 6-1. 短い文章チェック（10文字未満、[|]の3文字を含む）
  const cleanSentence = sentence.replace(/\[([^|]+)\|[^\]]+\]/g, '$1')
  if (sentence.length < 10) {
    errors.push(`文章が短すぎます（${sentence.length}文字）: 10文字以上必要です（[|]の3文字を含む）（その学年までに習う漢字をひらがなにするの禁止）`)
  }

  // 6-2. 同じ文章内での入力漢字の重複チェック
  const inputKanjiCounts = new Map<string, number>()
  for (const inputText of inputs) {
    const inputKanjiArray = extractKanji(inputText)
    for (const kanji of inputKanjiArray) {
      inputKanjiCounts.set(kanji, (inputKanjiCounts.get(kanji) || 0) + 1)
    }
  }

  for (const [kanji, count] of inputKanjiCounts) {
    if (count > 1) {
      errors.push(`同じ文章内で入力漢字「${kanji}」が${count}回使用されています（入力項目間での重複は禁止）`)
    }
  }

  // 7. 入力項目数チェック（1個以下）
  const inputCount = inputs.length
  if (inputCount > 1) {
    errors.push(`入力項目が多すぎます（${inputCount}個）: 1個以下にしてください`)
  }

  // 8. 入力項目の連続性チェック
  if (plainSentence.includes('[][]')) {
    errors.push('入力項目が連続しています')
  }

  // 9. 入力項目の文字種チェック（漢字のみ）
  for (const inputText of inputs) {
    // 通常の漢字範囲 + CJK拡張Bの𠮟を含む範囲
    const nonKanji = inputText.match(/[^\u4E00-\u9FAF\u{20000}-\u{2A6DF}]/gu)
    if (nonKanji) {
      errors.push(`入力項目に漢字以外が含まれています: "${inputText}" (${nonKanji.join('')})`)
    }
  }

  // 10. 入力漢字の学年適合性チェック
  // targetGradeは既に上で定義済み

  // 各入力項目に対象学年の漢字が最低1文字含まれているかチェック
  for (const inputText of inputs) {
    const inputKanji = extractKanji(inputText)
    let hasTargetGradeKanji = false

    for (const kanji of inputKanji) {
      const kanjiGrade = getKanjiGrade(kanji, gradeKanjiMap)
      if (kanjiGrade === 0) {
        errors.push(`入力漢字が学習漢字ではありません: ${kanji}`)
      } else if (kanjiGrade === targetGrade) {
        hasTargetGradeKanji = true
      }
    }

    if (inputKanji.length > 0 && !hasTargetGradeKanji) {
      errors.push(`入力項目「${inputText}」に${targetGrade}年生の漢字が含まれていません`)
    }
  }

  // 11. 文章全体の学年適合性チェック
  for (const kanji of kanjiSet) {
    const kanjiGrade = getKanjiGrade(kanji, gradeKanjiMap)
    if (kanjiGrade === 0) {
      errors.push(`学習漢字ではありません: ${kanji}`)
    } else if (kanjiGrade > targetGrade) {
      errors.push(`より高学年の漢字が使われています: ${kanji} (${kanjiGrade}年生)`)
    }
  }

  // 12. 文法・表現の誤用チェック
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

  // 13. 長い語尾・句読点・漢字含有率チェック（新規追加・修正時のみ）
  // コマンドライン実行時のチェック（addQuestion、addQuestionAuto、fixQuestionByIdから呼ばれた場合）
  const isCommandLineExecution = process.argv.some((arg) => arg.includes('addQuestion') || arg.includes('addQuestionAuto') || arg.includes('fixQuestionById'))

  if (isCommandLineExecution) {
    // 長い語尾のチェック
    if (sentence.match(/ました[。]?$|やしました[。]?$|します[。]?$|います[。]?$|でした[。]?$|ですます[。]?$|ください[。]?$|なさい[。]?$/)) {
      errors.push('短い表現にしてください')
    }

    // 句読点のチェック
    if (sentence.includes('。') || sentence.includes('、')) {
      errors.push('短い表現にしてください')
    }

    // 漢字含有率チェック（学年別）
    const kanjiCount = cleanSentence.split('').filter((char) => (char >= '\u4E00' && char <= '\u9FFF') || (char >= '\u20000' && char <= '\u2A6DF')).length
    const kanjiRatio = (kanjiCount / cleanSentence.length) * 100

    // 学年別の必要漢字含有率を設定
    let requiredRatio = 30 // デフォルト
    if (targetGrade === 1) {
      requiredRatio = 20
    } else if (targetGrade === 2) {
      requiredRatio = 25
    }

    if (kanjiRatio < requiredRatio) {
      errors.push(`漢字含有率が低すぎます（${kanjiRatio.toFixed(1)}%）: ${requiredRatio}%以上必要です`)
    }
  }

  return errors
}

// targetGradeを指定してバリデーションを実行する簡易関数
export function validateQuestionWithGrade(
  sentence: string,
  targetGrade: number,
  kanjiReadings: KanjiReading,
  compoundReadings: CompoundReading,
  gradeKanjiMap: Map<number, Set<string>>,
  allKanjiSet: Set<string>
): string[] {
  // ファイル名を学年から生成
  const fileName = targetGrade === 7 ? 'questions-junior.json' : `questions-elementary${targetGrade}.json`

  const question: Question = {
    id: 'temp',
    sentence: sentence,
  }

  return validateQuestion(question, 0, fileName, kanjiReadings, compoundReadings, gradeKanjiMap, allKanjiSet)
}

// 読みデータを読み込む
export function loadReadingData(): { kanjiReadings: KanjiReading; compoundReadings: CompoundReading } {
  const kanjiReadingsPath = join(__dirname, 'data/kanji-readings/kanji-readings.json')
  const kanjiReadings: KanjiReading = JSON.parse(readFileSync(kanjiReadingsPath, 'utf-8'))

  const compoundReadingsPath = join(__dirname, 'data/kanji-readings/compound-readings.json')
  const compoundReadings: CompoundReading = JSON.parse(readFileSync(compoundReadingsPath, 'utf-8'))

  return { kanjiReadings, compoundReadings }
}
