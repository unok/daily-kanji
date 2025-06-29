import { readFileSync } from 'fs'
import { join } from 'path'

interface Question {
  id: string
  sentence: string
}

interface QuestionsFile {
  questions: Question[]
}

// 全てのファイルを読み込んで重複文章を分析
function analyzeDuplicateSentences() {
  const questionsDir = join(process.cwd(), 'src/data/questions')
  const sentenceMap = new Map<string, Array<{ file: string; id: string }>>()

  // ファイル一覧を取得
  const files = [
    'questions-elementary1-part1.json',
    'questions-elementary1-part2.json',
    'questions-elementary1-part3.json',
    'questions-elementary1-part4.json',
    'questions-elementary1-part5.json',
    'questions-elementary1-part6.json',
    'questions-elementary1-part7.json',
    'questions-elementary2-part1.json',
    'questions-elementary2-part2.json',
    'questions-elementary2-part3.json',
    'questions-elementary2-part4.json',
    'questions-elementary2-part5.json',
    'questions-elementary2-part6.json',
    'questions-elementary2-part7.json',
    'questions-elementary2-part8.json',
    'questions-elementary2-part9.json',
    'questions-elementary3-part1.json',
    'questions-elementary3-part2.json',
    'questions-elementary3-part3.json',
    'questions-elementary3-part4.json',
    'questions-elementary3-part5.json',
    'questions-elementary3-part6.json',
    'questions-elementary3-part7.json',
    'questions-elementary3-part8.json',
    'questions-elementary3-part9.json',
    'questions-elementary4-part1.json',
    'questions-elementary4-part2.json',
    'questions-elementary4-part3.json',
    'questions-elementary4-part4.json',
    'questions-elementary4-part5.json',
    'questions-elementary4-part6.json',
    'questions-elementary4-part7.json',
    'questions-elementary4-part8.json',
    'questions-elementary4-part9.json',
    'questions-elementary5-part1.json',
    'questions-elementary5-part2.json',
    'questions-elementary5-part3.json',
    'questions-elementary5-part4.json',
    'questions-elementary5-part5.json',
    'questions-elementary5-part6.json',
    'questions-elementary5-part7.json',
    'questions-elementary5-part8.json',
    'questions-elementary5-part9.json',
    'questions-elementary6-part1.json',
    'questions-elementary6-part2.json',
    'questions-elementary6-part3.json',
    'questions-elementary6-part4.json',
    'questions-elementary6-part5.json',
    'questions-elementary6-part6.json',
    'questions-elementary6-part7.json',
    'questions-elementary6-part8.json',
    'questions-elementary6-part9.json',
    'questions-junior1-part1.json',
    'questions-junior1-part2.json',
    'questions-junior1-part3.json',
    'questions-junior2-part1.json',
    'questions-junior2-part2.json',
    'questions-junior2-part3.json',
    'questions-junior3-part1.json',
    'questions-junior3-part2.json',
    'questions-junior3-part3.json',
  ]

  // 各ファイルを処理
  for (const fileName of files) {
    const filePath = join(questionsDir, fileName)
    try {
      const content = readFileSync(filePath, 'utf-8')
      const data: QuestionsFile = JSON.parse(content)

      for (const question of data.questions) {
        const sentence = question.sentence

        if (!sentenceMap.has(sentence)) {
          sentenceMap.set(sentence, [])
        }

        sentenceMap.get(sentence)!.push({
          file: fileName,
          id: question.id,
        })
      }
    } catch (error) {
      console.error(`Error reading ${fileName}:`, error)
    }
  }

  // 重複文章を表示
  const duplicates = Array.from(sentenceMap.entries())
    .filter(([_, occurrences]) => occurrences.length > 1)
    .sort((a, b) => b[1].length - a[1].length)

  console.log('📊 重複文章の分析結果')
  console.log('==================================================')
  console.log(`総重複文章数: ${duplicates.length} 件`)
  console.log(`総重複発生回数: ${duplicates.reduce((sum, [_, occurrences]) => sum + occurrences.length, 0)} 回`)
  console.log()

  // 重複回数の多い順に表示
  duplicates.slice(0, 20).forEach(([sentence, occurrences], index) => {
    console.log(`${index + 1}. 「${sentence}」 (${occurrences.length}回重複)`)
    occurrences.forEach(({ file, id }) => {
      console.log(`   - ${file}: ${id}`)
    })
    console.log()
  })

  if (duplicates.length > 20) {
    console.log(`... 他 ${duplicates.length - 20} 件の重複文章`)
  }

  return duplicates
}

// 実行
analyzeDuplicateSentences()
