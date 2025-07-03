import { addQuestionToFile } from './utils/questionManager.js'
import { getGradeKanjiList, getKanjiGrade } from './utils/validation.js'

async function addQuestion(grade: string, sentence: string): Promise<void> {
  await addQuestionToFile(grade, sentence)
}

// コマンドライン引数から実行
async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2 || args.length > 4) {
    console.error('使用方法: npx tsx src/scripts/addQuestionAuto.ts "<sentence>" --target-kanji <kanji>')
    console.error('例: npx tsx src/scripts/addQuestionAuto.ts "[黄|き]色い花です。" --target-kanji 黄')
    console.error('例: npx tsx src/scripts/addQuestionAuto.ts "古い[机|つくえ]を使います。" --target-kanji 机')
    process.exit(1)
  }

  let sentence = args[0]
  let targetKanji = ''

  // オプション解析
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--target-kanji' && i + 1 < args.length) {
      targetKanji = args[i + 1]
      break
    }
  }

  if (!targetKanji) {
    console.error('エラー: --target-kanji オプションが必要です')
    process.exit(1)
  }

  // シェルによって挿入された ' < /dev/null | ' を '|' に戻す
  sentence = sentence.replace(/ < \/dev\/null \| /g, '|')

  try {
    // 漢字の学年を判定
    const gradeKanjiMap = getGradeKanjiList()
    const targetGrade = getKanjiGrade(targetKanji, gradeKanjiMap)

    if (targetGrade === 0) {
      throw new Error(`指定された漢字「${targetKanji}」は学習漢字ではありません。`)
    }

    // 問題文に target-kanji が含まれているかチェック
    if (!sentence.includes(targetKanji)) {
      throw new Error(`問題文に指定された漢字「${targetKanji}」が含まれていません。`)
    }

    console.log(`\n📝 対象漢字「${targetKanji}」は${targetGrade === 7 ? '中学校' : `${targetGrade}年生`}の漢字です。`)

    // 学年に応じたグレード文字列を設定
    const grade = targetGrade === 7 ? 'junior' : targetGrade.toString()

    await addQuestion(grade, sentence)
  } catch (error) {
    console.error('エラー:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
