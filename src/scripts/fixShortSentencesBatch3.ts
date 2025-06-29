import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface Question {
  id: string
  sentence: string
}

interface QuestionsFile {
  questions: Question[]
}

function fixShortSentencesFinal(filePath: string): number {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const data: QuestionsFile = JSON.parse(content)
    let fixedCount = 0

    for (const question of data.questions) {
      const originalSentence = question.sentence

      // 文字数をカウント（読み仮名部分を除く）
      const displayText = originalSentence.replace(/\[([^\]]+)\|[^\]]+\]/g, '$1')

      if (displayText.length < 9) {
        let newSentence = originalSentence

        // 高学年向けの詳細なパターンマッチング
        if (displayText.endsWith('ます。')) {
          if (displayText.includes('異')) {
            newSentence = '文化の違いを' + originalSentence
          } else if (displayText.includes('移')) {
            newSentence = '新しい場所に' + originalSentence
          } else if (displayText.includes('域')) {
            newSentence = 'この地' + originalSentence
          } else if (displayText.includes('宇')) {
            newSentence = '広大な' + originalSentence
          } else if (displayText.includes('宙')) {
            newSentence = '無限の' + originalSentence
          } else if (displayText.includes('庫')) {
            newSentence = '倉' + originalSentence
          } else if (displayText.includes('創')) {
            newSentence = '新しいアイデアで' + originalSentence
          } else if (displayText.includes('層')) {
            newSentence = '地質の' + originalSentence
          } else if (displayText.includes('操')) {
            newSentence = '慎重に機械を' + originalSentence
          } else if (displayText.includes('装')) {
            newSentence = '美しく' + originalSentence
          } else if (displayText.includes('蔵')) {
            newSentence = '古い' + originalSentence
          } else if (displayText.includes('存')) {
            newSentence = '大切に' + originalSentence
          } else if (displayText.includes('尊')) {
            newSentence = '心から' + originalSentence
          } else if (displayText.includes('宅')) {
            newSentence = '自' + originalSentence
          } else if (displayText.includes('担')) {
            newSentence = '責任を' + originalSentence
          } else if (displayText.includes('探')) {
            newSentence = '宝物を' + originalSentence
          } else if (displayText.includes('誕')) {
            newSentence = 'お' + originalSentence
          } else if (displayText.includes('段')) {
            newSentence = '階' + originalSentence
          } else if (displayText.includes('暖')) {
            newSentence = '部屋を' + originalSentence
          } else if (displayText.includes('値')) {
            newSentence = '商品の' + originalSentence
          } else if (displayText.includes('宙')) {
            newSentence = '宇' + originalSentence
          } else {
            newSentence = '最近' + originalSentence
          }
        } else if (displayText.endsWith('です。')) {
          if (displayText.includes('異')) {
            newSentence = '特' + originalSentence
          } else if (displayText.includes('域')) {
            newSentence = '大切な地' + originalSentence
          } else if (displayText.includes('宇')) {
            newSentence = '神秘的な' + originalSentence
          } else if (displayText.includes('宙')) {
            newSentence = '宇' + originalSentence
          } else if (displayText.includes('庫')) {
            newSentence = '新しい倉' + originalSentence
          } else if (displayText.includes('層')) {
            newSentence = '厚い' + originalSentence
          } else if (displayText.includes('装')) {
            newSentence = 'きれいな' + originalSentence
          } else if (displayText.includes('蔵')) {
            newSentence = '伝統的な' + originalSentence
          } else if (displayText.includes('宅')) {
            newSentence = '立派な自' + originalSentence
          } else if (displayText.includes('段')) {
            newSentence = '高い階' + originalSentence
          } else if (displayText.includes('値')) {
            newSentence = '適正な' + originalSentence
          } else {
            newSentence = 'とても良い' + originalSentence
          }
        } else if (displayText.endsWith('。')) {
          if (displayText.includes('段')) {
            newSentence = originalSentence.replace('。', 'を上りました。')
          } else if (displayText.includes('値')) {
            newSentence = originalSentence.replace('。', 'を調べました。')
          } else if (displayText.includes('層')) {
            newSentence = originalSentence.replace('。', 'を調べました。')
          } else {
            newSentence = '今日は' + originalSentence
          }
        }

        const newDisplayText = newSentence.replace(/\[([^\]]+)\|[^\]]+\]/g, '$1')
        if (newDisplayText.length >= 9 && newSentence !== originalSentence) {
          question.sentence = newSentence
          fixedCount++
        }
      }
    }

    if (fixedCount > 0) {
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
      console.log(`${filePath}: ${fixedCount}件の短い文章を修正しました`)
    }

    return fixedCount
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error)
    return 0
  }
}

// 短い文章が多いファイルを処理
const questionsDir = join(process.cwd(), 'src/data/questions')
const files = [
  'questions-elementary4-part9.json',
  'questions-elementary6-part5.json',
  'questions-elementary6-part1.json',
  'questions-elementary6-part3.json',
  'questions-elementary3-part7.json',
  'questions-elementary5-part1.json',
]

let totalFixed = 0
for (const file of files) {
  const filePath = join(questionsDir, file)
  totalFixed += fixShortSentencesFinal(filePath)
}

console.log(`\n合計 ${totalFixed} 件の短い文章を修正しました。`)
