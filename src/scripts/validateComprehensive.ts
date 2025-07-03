import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractKanji, getAllKanjiSet, getGradeKanjiList, getKanjiGrade, loadReadingData, type Question, validateQuestion } from './utils/validation.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface ValidationResult {
  file: string
  errors: ProblemError[]
}

interface ProblemError {
  questionIndex: number
  id: string
  sentence: string
  errors: string[]
}

interface DuplicateSentence {
  sentence: string
  files: string[]
  ids: string[]
}

interface KanjiUsage {
  kanji: string
  count: number
  locations: string[]
}

interface ShortSentence {
  file: string
  id: string
  sentence: string
  length: number
}

interface DuplicateKanjiError {
  file: string
  id: string
  sentence: string
  kanjiChar: string
}

// 問題ファイルのリストを動的に取得
function getQuestionFiles(): string[] {
  const questionsDir = join(__dirname, '../data/questions')
  const files = readdirSync(questionsDir)
  return files.filter((file) => file.startsWith('questions-') && file.endsWith('.json')).sort() // ファイル名順にソート
}

// メイン処理
function main() {
  // コマンドライン引数の解析
  const args = process.argv.slice(2)
  let listIdsMode: string | null = null

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--list-ids' && i + 1 < args.length) {
      listIdsMode = args[i + 1]
      break
    }
  }

  // 利用可能なエラータイプを表示
  if (listIdsMode && !['higher-grade', 'inappropriate-grade', 'grammar-nanode', 'consecutive-input', 'no-input', 'all'].includes(listIdsMode)) {
    console.error('エラー: 無効なエラータイプです。')
    console.error('利用可能なエラータイプ:')
    console.error('  higher-grade      - より高学年の漢字が使われているエラー')
    console.error('  inappropriate-grade - 入力漢字の学年が不適切なエラー')
    console.error('  grammar-nanode    - 「なのです」が不自然なエラー')
    console.error('  consecutive-input - 入力項目が連続しているエラー')
    console.error('  no-input         - 入力項目がありません')
    console.error('  all              - すべてのエラー')
    process.exit(1)
  }
  // 読みデータを読み込む
  const { kanjiReadings, compoundReadings } = loadReadingData()

  // 学年別漢字リストを取得
  const gradeKanjiMap = getGradeKanjiList()
  const allKanjiSet = getAllKanjiSet(gradeKanjiMap)

  // 漢字使用頻度を記録（全体用）
  const kanjiUsageMap = new Map<string, KanjiUsage>()
  for (const kanji of allKanjiSet) {
    kanjiUsageMap.set(kanji, { kanji, count: 0, locations: [] })
  }

  // 学年別の漢字使用頻度を記録
  const gradeKanjiUsageMap = new Map<number, Map<string, KanjiUsage>>()
  for (let grade = 1; grade <= 7; grade++) {
    const gradeMap = new Map<string, KanjiUsage>()
    const gradeKanjiSet = gradeKanjiMap.get(grade) || new Set()
    for (const kanji of gradeKanjiSet) {
      gradeMap.set(kanji, { kanji, count: 0, locations: [] })
    }
    gradeKanjiUsageMap.set(grade, gradeMap)
  }

  // ID重複チェック用
  const idMap = new Map<string, string[]>()
  // 文章重複チェック用
  const sentenceMap = new Map<string, Array<{ file: string; id: string }>>()
  // 短い文章チェック用
  const shortSentences: ShortSentence[] = []
  // 入力漢字重複チェック用
  const duplicateKanjiErrors: DuplicateKanjiError[] = []

  // 学年別統計用
  const gradeStats = new Map<
    string,
    {
      totalQuestions: number
      kanjiRatioErrors: number
    }
  >()
  // 初期化
  const grades = ['1', '2', '3', '4', '5', '6', 'junior']
  for (const grade of grades) {
    gradeStats.set(grade, { totalQuestions: 0, kanjiRatioErrors: 0 })
  }

  // 各ファイルを検証
  const allResults: ValidationResult[] = []
  let totalErrors = 0
  const questionFiles = getQuestionFiles()

  // IDリスト収集モード用
  const errorIdsByType: { [key: string]: string[] } = {
    'higher-grade': [],
    'inappropriate-grade': [],
    'grammar-nanode': [],
    'consecutive-input': [],
    'no-input': [],
    all: [],
  }

  if (!listIdsMode) {
    console.log(`\n検証対象ファイル数: ${questionFiles.length}`)
  }

  for (const fileName of questionFiles) {
    const filePath = join(__dirname, `../data/questions/${fileName}`)
    const fileData = JSON.parse(readFileSync(filePath, 'utf-8'))

    const questions: Question[] = fileData.questions || fileData

    const errors: ProblemError[] = []

    // ファイル名から学年を判定
    let currentGrade = 'junior'
    if (fileName.includes('elementary1')) currentGrade = '1'
    else if (fileName.includes('elementary2')) currentGrade = '2'
    else if (fileName.includes('elementary3')) currentGrade = '3'
    else if (fileName.includes('elementary4')) currentGrade = '4'
    else if (fileName.includes('elementary5')) currentGrade = '5'
    else if (fileName.includes('elementary6')) currentGrade = '6'

    const stats = gradeStats.get(currentGrade)
    if (stats) {
      stats.totalQuestions += questions.length
    }

    questions.forEach((question, index) => {
      // ID重複チェック
      if (idMap.has(question.id)) {
        idMap.get(question.id)?.push(fileName)
      } else {
        idMap.set(question.id, [fileName])
      }

      // 文章重複チェック
      if (sentenceMap.has(question.sentence)) {
        sentenceMap.get(question.sentence)?.push({ file: fileName, id: question.id })
      } else {
        sentenceMap.set(question.sentence, [{ file: fileName, id: question.id }])
      }

      // 問題の検証
      const questionErrors = validateQuestion(question, index, fileName, kanjiReadings, compoundReadings, gradeKanjiMap, allKanjiSet)

      // validateQuestionの結果から短い文章エラーと入力漢字重複エラーを抽出
      const hasShortSentence = questionErrors.some((err) => err.includes('文章が短すぎます'))
      const duplicateKanjiMatches = questionErrors.filter((err) => err.includes('が文章内に重複しています'))
      const hasKanjiRatioError = questionErrors.some((err) => err.includes('漢字含有率が低すぎます'))

      if (hasKanjiRatioError && stats) {
        stats.kanjiRatioErrors++
      }

      if (hasShortSentence) {
        const cleanSentence = question.sentence.replace(/\[([^|]+)\|[^\]]+\]/g, '$1')
        shortSentences.push({
          file: fileName,
          id: question.id,
          sentence: question.sentence,
          length: cleanSentence.length,
        })
      }

      for (const duplicateError of duplicateKanjiMatches) {
        const kanjiMatch = duplicateError.match(/入力漢字「(.+?)」が文章内に重複しています/)
        if (kanjiMatch) {
          duplicateKanjiErrors.push({
            file: fileName,
            id: question.id,
            sentence: question.sentence,
            kanjiChar: kanjiMatch[1],
          })
        }
      }

      if (questionErrors.length > 0) {
        errors.push({
          questionIndex: index,
          id: question.id,
          sentence: question.sentence,
          errors: questionErrors,
        })
        totalErrors += questionErrors.length

        // IDリスト収集モードの場合、エラータイプ別にIDを収集
        if (listIdsMode) {
          const hasHigherGrade = questionErrors.some((err) => err.includes('より高学年の漢字が使われています'))
          const hasInappropriateGrade = questionErrors.some((err) => err.includes('入力漢字の学年が不適切'))
          const hasGrammarNanode = questionErrors.some((err) => err.includes('「なのです」が不自然'))
          const hasConsecutiveInput = questionErrors.some((err) => err.includes('入力項目が連続しています'))
          const hasNoInput = questionErrors.some((err) => err.includes('入力項目がありません'))

          if (hasHigherGrade && (listIdsMode === 'higher-grade' || listIdsMode === 'all')) {
            errorIdsByType['higher-grade'].push(question.id)
          }
          if (hasInappropriateGrade && (listIdsMode === 'inappropriate-grade' || listIdsMode === 'all')) {
            errorIdsByType['inappropriate-grade'].push(question.id)
          }
          if (hasGrammarNanode && (listIdsMode === 'grammar-nanode' || listIdsMode === 'all')) {
            errorIdsByType['grammar-nanode'].push(question.id)
          }
          if (hasConsecutiveInput && (listIdsMode === 'consecutive-input' || listIdsMode === 'all')) {
            errorIdsByType['consecutive-input'].push(question.id)
          }
          if (hasNoInput && (listIdsMode === 'no-input' || listIdsMode === 'all')) {
            errorIdsByType['no-input'].push(question.id)
          }
          if (listIdsMode === 'all') {
            errorIdsByType.all.push(question.id)
          }
        }
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

      // ファイル名から学年を判定
      let fileGrade = 7 // デフォルトは中学校
      if (fileName.includes('elementary')) {
        const gradeMatch = fileName.match(/elementary(\d+)/)
        if (gradeMatch) {
          fileGrade = Number.parseInt(gradeMatch[1])
        }
      }

      for (const kanji of uniqueKanji) {
        // 全体の使用頻度を更新
        if (kanjiUsageMap.has(kanji)) {
          const usage = kanjiUsageMap.get(kanji)
          if (usage) {
            usage.count++
            usage.locations.push(`${fileName} #${index}: ${question.sentence}`)
          }
        }

        // 学年別の使用頻度を更新
        const kanjiGrade = getKanjiGrade(kanji, gradeKanjiMap)
        if (kanjiGrade === fileGrade) {
          const gradeMap = gradeKanjiUsageMap.get(kanjiGrade)
          if (gradeMap?.has(kanji)) {
            const usage = gradeMap.get(kanji)
            if (usage) {
              usage.count++
              usage.locations.push(`${fileName} #${index}: ${question.sentence}`)
            }
          }
        }
      }
    })

    if (errors.length > 0) {
      allResults.push({ file: fileName, errors })
    }
  }

  // IDリスト収集モードの場合、ファイルに出力して終了
  if (listIdsMode) {
    const outputFile = `error-ids-${listIdsMode}-${Date.now()}.txt`
    const ids =
      listIdsMode === 'all'
        ? [...new Set(errorIdsByType.all)] // 重複削除
        : errorIdsByType[listIdsMode]

    writeFileSync(outputFile, `${ids.join('\n')}\n`)
    console.log(`\n✅ ${ids.length}個のIDを ${outputFile} に出力しました。`)
    console.log('\nエラータイプ別集計:')
    if (listIdsMode === 'all' || listIdsMode === 'higher-grade') {
      console.log(`  より高学年の漢字: ${errorIdsByType['higher-grade'].length}個`)
    }
    if (listIdsMode === 'all' || listIdsMode === 'inappropriate-grade') {
      console.log(`  入力漢字の学年不適切: ${errorIdsByType['inappropriate-grade'].length}個`)
    }
    if (listIdsMode === 'all' || listIdsMode === 'grammar-nanode') {
      console.log(`  「なのです」が不自然: ${errorIdsByType['grammar-nanode'].length}個`)
    }
    if (listIdsMode === 'all' || listIdsMode === 'consecutive-input') {
      console.log(`  入力項目が連続: ${errorIdsByType['consecutive-input'].length}個`)
    }
    if (listIdsMode === 'all' || listIdsMode === 'no-input') {
      console.log(`  入力項目がありません: ${errorIdsByType['no-input'].length}個`)
    }
    return
  }

  // 結果を表示
  console.log('=== 漢字学習システム 包括的検証結果 ===\n')

  // 学年別の低頻度漢字を収集
  const gradeLowFreqKanji = new Map<number, string[]>()
  let totalGradeLowFreqCount = 0

  for (const [grade, gradeMap] of gradeKanjiUsageMap) {
    const lowFreq: string[] = []
    for (const usage of gradeMap.values()) {
      if (usage.count < 5) {
        lowFreq.push(usage.kanji)
      }
    }
    if (lowFreq.length > 0) {
      gradeLowFreqKanji.set(grade, lowFreq)
      totalGradeLowFreqCount += lowFreq.length
    }
  }

  const hasLowFreqError = totalGradeLowFreqCount > 0

  // ID重複を検出
  const duplicateIds: Array<{ id: string; files: string[] }> = []
  for (const [id, files] of idMap) {
    if (files.length > 1) {
      duplicateIds.push({ id, files })
    }
  }

  // 文章重複を検出
  const duplicateSentences: DuplicateSentence[] = []
  for (const [sentence, locations] of sentenceMap) {
    if (locations.length > 1) {
      const files = [...new Set(locations.map((l) => l.file))]
      const ids = locations.map((l) => l.id)
      duplicateSentences.push({ sentence, files, ids })
    }
  }

  if (
    allResults.length === 0 &&
    !hasLowFreqError &&
    duplicateIds.length === 0 &&
    duplicateSentences.length === 0 &&
    shortSentences.length === 0 &&
    duplicateKanjiErrors.length === 0
  ) {
    console.log('✅ すべての問題が検証をパスしました！\n')
  } else {
    const totalErrorsWithFreq =
      totalErrors + totalGradeLowFreqCount + duplicateIds.length + duplicateSentences.length + shortSentences.length + duplicateKanjiErrors.length
    console.log(`❌ ${totalErrorsWithFreq}個のエラーが見つかりました\n`)

    for (const result of allResults) {
      console.log(`\n📁 ${result.file}`)
      console.log('─'.repeat(60))

      for (const error of result.errors) {
        console.log(`\n問題 #${error.questionIndex} [ID: ${error.id}]`)
        console.log(`文章: ${error.sentence}`)
        console.log('エラー:')
        for (const e of error.errors) {
          console.log(`  ・${e}`)
        }
      }
    }

    // 学年別低頻度エラーも表示
    if (hasLowFreqError) {
      console.log('\n📁 学年別漢字使用頻度エラー')
      console.log('─'.repeat(60))
      for (const [grade, lowFreq] of gradeLowFreqKanji) {
        const gradeName = grade === 7 ? '中学校' : `小学${grade}年`
        console.log(`\n${gradeName}: ${lowFreq.length}字の漢字が学年内で5回未満しか使用されていません`)
        // 最初の10個を表示
        const displayCount = Math.min(10, lowFreq.length)
        console.log(`  対象漢字: ${lowFreq.slice(0, displayCount).join('、')}${lowFreq.length > 10 ? ` ... 他${lowFreq.length - 10}字` : ''}`)
      }
    }

    // ID重複エラーを表示
    if (duplicateIds.length > 0) {
      console.log('\n📁 ID重複エラー')
      console.log('─'.repeat(60))
      for (const { id, files } of duplicateIds) {
        console.log(`\nID: ${id}`)
        console.log(`ファイル: ${files.join(', ')}`)
      }
    }

    // 文章重複エラーを表示
    if (duplicateSentences.length > 0) {
      console.log('\n📁 文章重複エラー')
      console.log('─'.repeat(60))
      for (const { sentence, files, ids } of duplicateSentences) {
        console.log(`\n文章: ${sentence}`)
        console.log(`ファイル: ${files.join(', ')}`)
        console.log(`ID: ${ids.join(', ')}`)
      }
    }

    // 短い文章エラーを表示
    if (shortSentences.length > 0) {
      console.log('\n📁 短い文章エラー（9文字未満）')
      console.log('─'.repeat(60))
      for (const { file, id, sentence, length } of shortSentences) {
        console.log(`\nファイル: ${file}`)
        console.log(`ID: ${id}`)
        console.log(`文章: ${sentence}`)
        console.log(`文字数: ${length}`)
      }
    }

    // 入力漢字重複エラーを表示
    if (duplicateKanjiErrors.length > 0) {
      console.log('\n📁 入力漢字重複エラー')
      console.log('─'.repeat(60))
      for (const { file, id, sentence, kanjiChar } of duplicateKanjiErrors) {
        console.log(`\nファイル: ${file}`)
        console.log(`ID: ${id}`)
        console.log(`文章: ${sentence}`)
        console.log(`重複漢字: ${kanjiChar}`)
      }
    }
  }

  // 全体統計を表示
  console.log('\n\n=== 学年別漢字使用頻度統計 ===\n')

  // 学年別の統計を表示
  for (const [grade, gradeMap] of gradeKanjiUsageMap) {
    const gradeName = grade === 7 ? '中学校' : `小学${grade}年`
    const gradeKanjiSet = gradeKanjiMap.get(grade) || new Set()
    const totalKanjiCount = gradeKanjiSet.size

    console.log(`【${gradeName}】`)

    // 使用頻度でソート
    const sortedUsage = Array.from(gradeMap.values()).sort((a, b) => a.count - b.count)

    // 0回使用の漢字
    const unusedKanji = sortedUsage.filter((u) => u.count === 0)
    const lowFreqKanji = sortedUsage.filter((u) => u.count > 0 && u.count < 5)
    const wellUsedKanji = sortedUsage.filter((u) => u.count >= 5)

    if (unusedKanji.length > 0) {
      console.log(`  未使用: ${unusedKanji.length}字`)
    }

    if (lowFreqKanji.length > 0) {
      console.log(`  5回未満: ${lowFreqKanji.length}字`)

      // 使用回数でグループ化
      const byCount = new Map<number, string[]>()
      for (const usage of lowFreqKanji) {
        if (!byCount.has(usage.count)) {
          byCount.set(usage.count, [])
        }
        byCount.get(usage.count)?.push(usage.kanji)
      }

      // 使用回数順に表示（最大10文字まで）
      for (let count = 1; count <= 4; count++) {
        const kanjiList = byCount.get(count)
        if (kanjiList && kanjiList.length > 0) {
          const displayList = kanjiList.slice(0, 10)
          const suffix = kanjiList.length > 10 ? ` ... 他${kanjiList.length - 10}字` : ''
          console.log(`    ${count}回: ${displayList.join('')}${suffix}`)
        }
      }
    }

    console.log(`  5回以上: ${wellUsedKanji.length}字 (${((wellUsedKanji.length / totalKanjiCount) * 100).toFixed(1)}%)`)
    console.log('')
  }

  // 全体のサマリー
  console.log('\n=== サマリー ===')
  console.log(`検証ファイル数: ${questionFiles.length}`)
  console.log(`学年別低頻度漢字エラー: ${totalGradeLowFreqCount}個`)
  console.log(`ID重複エラー: ${duplicateIds.length}個`)
  console.log(`文章重複エラー: ${duplicateSentences.length}個`)
  console.log(`短い文章エラー: ${shortSentences.length}個`)
  console.log(`入力漢字重複エラー: ${duplicateKanjiErrors.length}個`)

  // 学年別漢字含有率エラー統計
  console.log('\n=== 学年別漢字含有率エラー統計 ===')
  const gradeNames = new Map([
    ['1', '小学1年'],
    ['2', '小学2年'],
    ['3', '小学3年'],
    ['4', '小学4年'],
    ['5', '小学5年'],
    ['6', '小学6年'],
    ['junior', '中学校'],
  ])

  for (const [grade, stats] of gradeStats) {
    const gradeName = gradeNames.get(grade) || grade
    const errorRate = stats.totalQuestions > 0 ? ((stats.kanjiRatioErrors / stats.totalQuestions) * 100).toFixed(1) : '0.0'
    console.log(`${gradeName}: ${stats.kanjiRatioErrors}/${stats.totalQuestions}問 (${errorRate}%)`)
  }

  // 全体の漢字含有率エラー
  const totalQuestions = Array.from(gradeStats.values()).reduce((sum, stats) => sum + stats.totalQuestions, 0)
  const totalKanjiRatioErrors = Array.from(gradeStats.values()).reduce((sum, stats) => sum + stats.kanjiRatioErrors, 0)
  const totalErrorRate = totalQuestions > 0 ? ((totalKanjiRatioErrors / totalQuestions) * 100).toFixed(1) : '0.0'
  console.log(`\n合計: ${totalKanjiRatioErrors}/${totalQuestions}問 (${totalErrorRate}%)`)
}

// 実行
main()
