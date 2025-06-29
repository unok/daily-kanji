import * as fs from 'fs/promises'
import * as path from 'path'

interface Question {
  id: string
  sentence: string
}

interface QuestionFile {
  questions: Question[]
}

// 中学生用の短い文章を自然に拡張するための修正パターン
const expansionPatterns: Record<string, (sentence: string, cleanSentence: string) => string> = {
  // 動詞パターン
  'しました。': (sentence: string, cleanSentence: string) => {
    const contexts = ['昨日', '今朝', '先週', '今日', '無事に', '一緒に', 'ようやく', 'しっかりと', '丁寧に', '積極的に', '真剣に', '慎重に']
    const context = contexts[Math.floor(Math.random() * contexts.length)]
    return `${context}${sentence}`
  },

  'します。': (sentence: string, cleanSentence: string) => {
    const contexts = ['毎日', 'これから', '必ず', 'きちんと', '今日も', '明日', '来週', '定期的に', '慎重に', '積極的に', '熱心に', '確実に']
    const context = contexts[Math.floor(Math.random() * contexts.length)]
    return `${context}${sentence}`
  },

  'です。': (sentence: string, cleanSentence: string) => {
    if (cleanSentence.includes('の') || cleanSentence.includes('が')) {
      return sentence.replace('です。', 'なのです。')
    }
    if (cleanSentence.includes('い')) {
      return `とても${sentence}`
    }
    if (cleanSentence.includes('な')) {
      return `非常に${sentence}`
    }
    return `これが${sentence}`
  },

  'ます。': (sentence: string, cleanSentence: string) => {
    if (cleanSentence.includes('行き') || cleanSentence.includes('来')) {
      return `必ず${sentence}`
    }
    if (cleanSentence.includes('見') || cleanSentence.includes('聞')) {
      return `注意深く${sentence}`
    }
    if (cleanSentence.includes('考え') || cleanSentence.includes('思い')) {
      return `真剣に${sentence}`
    }
    return `今日も${sentence}`
  },
}

async function fixShortSentences(targetFile: string) {
  const questionsDir = path.join(process.cwd(), 'src', 'data', 'questions')
  const filePath = path.join(questionsDir, targetFile)

  const content = await fs.readFile(filePath, 'utf-8')
  const data: QuestionFile = JSON.parse(content)

  let fixedCount = 0

  data.questions = data.questions.map((q) => {
    const cleanSentence = q.sentence.replace(/\[[^\]]+\|[^\]]+\]/g, (match) => {
      return match.split('|')[0].slice(1)
    })

    if (cleanSentence.length < 9) {
      // パターンマッチングによる拡張
      for (const [pattern, transformer] of Object.entries(expansionPatterns)) {
        if (cleanSentence.endsWith(pattern)) {
          const newSentence = transformer(q.sentence, cleanSentence)
          const newClean = newSentence.replace(/\[[^\]]+\|[^\]]+\]/g, (m) => m.split('|')[0].slice(1))

          if (newClean.length >= 9 && newClean !== cleanSentence) {
            console.log(`  ✅ ID: ${q.id}`)
            console.log(`     旧: ${cleanSentence} (${cleanSentence.length}文字)`)
            console.log(`     新: ${newClean} (${newClean.length}文字)`)
            fixedCount++
            return { ...q, sentence: newSentence }
          }
        }
      }

      // より具体的な拡張ルール（中学生レベル）
      if (cleanSentence.length <= 8) {
        let newSentence = q.sentence

        // 中学生向けの拡張
        if (cleanSentence.includes('を')) {
          const modifiers = ['慎重に', '丁寧に', '確実に', '積極的に', '真剣に', 'しっかりと']
          const modifier = modifiers[Math.floor(Math.random() * modifiers.length)]
          newSentence = q.sentence.replace(/([をが])/, `$1${modifier}`)
        } else if (cleanSentence.includes('に')) {
          const contexts = ['今後', '将来', '来年度', '近日中に', '間もなく']
          const context = contexts[Math.floor(Math.random() * contexts.length)]
          newSentence = `${context}${q.sentence}`
        } else if (cleanSentence.includes('で')) {
          const contexts = ['チーム', 'クラス', '学校', '社会']
          const context = contexts[Math.floor(Math.random() * contexts.length)]
          newSentence = `${context}で${q.sentence}`
        } else if (cleanSentence.includes('と')) {
          const modifiers = ['共に', '一緒に', 'お互いに']
          const modifier = modifiers[Math.floor(Math.random() * modifiers.length)]
          newSentence = `${modifier}${q.sentence}`
        }

        const newClean = newSentence.replace(/\[[^\]]+\|[^\]]+\]/g, (m) => m.split('|')[0].slice(1))
        if (newClean.length >= 9 && newClean !== cleanSentence) {
          console.log(`  ✅ ID: ${q.id}`)
          console.log(`     旧: ${cleanSentence} (${cleanSentence.length}文字)`)
          console.log(`     新: ${newClean} (${newClean.length}文字)`)
          fixedCount++
          return { ...q, sentence: newSentence }
        }
      }
    }

    return q
  })

  if (fixedCount > 0) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2))
    console.log(`\n✅ ${targetFile}: ${fixedCount} 件の短い文章を修正しました。`)
  } else {
    console.log(`\n ℹ️ ${targetFile}: 修正対象の文章が見つかりませんでした。`)
  }

  return fixedCount
}

// メイン処理
async function main() {
  // 短い文章が多い中学校ファイルを優先的に処理
  const targetFiles = [
    'questions-junior-part21.json', // 34件
    'questions-junior-part20.json', // 26件
    'questions-junior-part2.json', // 15件
    'questions-junior-part5.json', // 11件
    'questions-junior-part22.json', // 8件
    'questions-junior-part4.json', // 7件
    'questions-junior-part7.json', // 4件
    'questions-junior-part3.json', // 4件
  ]

  console.log('🔧 中学校の短い文章の修正を開始します...\n')

  let totalFixed = 0
  for (const file of targetFiles) {
    try {
      const fixed = await fixShortSentences(file)
      totalFixed += fixed
    } catch (error) {
      console.error(`❌ ${file} の処理中にエラー: ${error}`)
    }
  }

  console.log(`\n✨ 合計 ${totalFixed} 件の短い文章を修正しました。`)
}

main().catch(console.error)
