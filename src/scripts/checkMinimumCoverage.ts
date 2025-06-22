import { EDUCATION_KANJI } from '../data/kanji-lists/education-kanji'
import { type DifficultyLevel, getQuestionsByDifficulty } from '../services/questionService'

// 5回未満の漢字を特定
function checkMinimumCoverage() {
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

  // 5回未満の教育漢字を特定
  const underrepresented: { kanji: string; count: number; grade: number }[] = []

  for (let grade = 1; grade <= 6; grade++) {
    const targetKanji = EDUCATION_KANJI[grade as keyof typeof EDUCATION_KANJI]
    for (const kanji of targetKanji) {
      const count = allKanjiCount.get(kanji) || 0
      if (count < 5) {
        underrepresented.push({ kanji, count, grade })
      }
    }
  }

  // 結果を表示
  process.stdout.write(`5回未満の教育漢字: ${underrepresented.length}個\n`)

  // 学年別にグループ化
  const byGrade: Record<number, typeof underrepresented> = {}
  for (const item of underrepresented) {
    if (!byGrade[item.grade]) byGrade[item.grade] = []
    byGrade[item.grade].push(item)
  }

  // 各学年の詳細
  for (let grade = 1; grade <= 6; grade++) {
    const items = byGrade[grade] || []
    if (items.length > 0) {
      process.stdout.write(`【${grade}年生】 ${items.length}個\n`)
      const sorted = items.sort((a, b) => a.count - b.count)
      const display = sorted
        .slice(0, 20)
        .map((item) => `${item.kanji}(${item.count})`)
        .join(', ')
      process.stdout.write(`  ${display}${sorted.length > 20 ? '...' : ''}\n`)
      process.stdout.write('\n')
    }
  }

  // 最も少ない漢字TOP10
  const topUnderrepresented = underrepresented.sort((a, b) => a.count - b.count).slice(0, 10)

  process.stdout.write('最も少ない漢字TOP10:\n')
  for (const item of topUnderrepresented) {
    process.stdout.write(`  ${item.kanji} (${item.count}回, ${item.grade}年生)\n`)
  }
}

checkMinimumCoverage()
