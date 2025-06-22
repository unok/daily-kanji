import { EDUCATION_KANJI } from '../data/kanji-lists/education-kanji'
import { type DifficultyLevel, getQuestionsByDifficulty } from '../services/questionService'

// 特定の回数の漢字を見つける
function findExactCount(targetCount: number) {
  const allKanjiCount = new Map<string, number>()

  // 各学年の分析
  for (let grade = 1; grade <= 6; grade++) {
    const questions = getQuestionsByDifficulty(`elementary${grade}` as DifficultyLevel)

    for (const question of questions) {
      for (const input of question.inputs) {
        if (input.kanji) {
          const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
          for (const k of kanjiInAnswer) {
            allKanjiCount.set(k, (allKanjiCount.get(k) || 0) + 1)
          }
        }
      }
    }
  }

  // 指定回数の教育漢字を特定
  const targetKanji: { kanji: string; count: number; grade: number }[] = []

  for (let grade = 1; grade <= 6; grade++) {
    const gradeKanji = EDUCATION_KANJI[grade as keyof typeof EDUCATION_KANJI]
    for (const kanji of gradeKanji) {
      const count = allKanjiCount.get(kanji) || 0
      if (count === targetCount) {
        targetKanji.push({ kanji, count, grade })
      }
    }
  }

  process.stdout.write(`${targetCount}回の教育漢字: ${targetKanji.length}個\n\n`)

  // 学年別に表示
  for (let grade = 1; grade <= 6; grade++) {
    const gradeItems = targetKanji.filter((item) => item.grade === grade)
    if (gradeItems.length > 0) {
      process.stdout.write(`【${grade}年生】 ${gradeItems.length}個\n`)
      process.stdout.write(`  ${gradeItems.map((item) => item.kanji).join(', ')}\n`)
    }
  }
}

// コマンドライン引数から回数を取得
const targetCount = Number.parseInt(process.argv[2]) || 3
findExactCount(targetCount)
