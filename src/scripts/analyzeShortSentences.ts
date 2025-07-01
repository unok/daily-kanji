import * as fs from 'node:fs/promises'
import * as path from 'node:path'

interface Question {
  id: string
  sentence: string
}

interface QuestionFile {
  questions: Question[]
}

async function analyzeShortSentences() {
  const questionsDir = path.join(process.cwd(), 'src', 'data', 'questions')
  const allFiles = await fs.readdir(questionsDir)
  const questionFiles = allFiles.filter((f) => f.endsWith('.json') && f.startsWith('questions-'))

  const shortSentencesByFile: Record<string, { question: Question; length: number; cleanSentence: string }[]> = {}
  let totalShort = 0

  for (const file of questionFiles) {
    const content = await fs.readFile(path.join(questionsDir, file), 'utf-8')
    const data: QuestionFile = JSON.parse(content)

    const shortSentences = data.questions
      .map((q) => {
        // ルビを除去して実際の文章の長さを計算
        const cleanSentence = q.sentence.replace(/\[[^\]]+\|[^\]]+\]/g, (match) => {
          return match.split('|')[0].slice(1)
        })
        return { question: q, length: cleanSentence.length, cleanSentence }
      })
      .filter((item) => item.length < 9)
      .sort((a, b) => a.length - b.length)

    if (shortSentences.length > 0) {
      shortSentencesByFile[file] = shortSentences
      totalShort += shortSentences.length
    }
  }

  console.log(`\n📊 短い文章の分析結果 (9文字未満)\n${'='.repeat(50)}`)
  console.log(`総計: ${totalShort} 件の短い文章\n`)

  for (const [file, sentences] of Object.entries(shortSentencesByFile)) {
    console.log(`\n📁 ${file}: ${sentences.length} 件`)
    console.log('-'.repeat(50))

    // 最初の10件を表示
    const displayCount = Math.min(10, sentences.length)
    for (let i = 0; i < displayCount; i++) {
      const { question, length, cleanSentence } = sentences[i]
      console.log(`  ${i + 1}. [${length}文字] "${cleanSentence}" (ID: ${question.id})`)
      console.log(`     元の文: ${question.sentence}`)
    }

    if (sentences.length > 10) {
      console.log(`  ... 他 ${sentences.length - 10} 件`)
    }
  }
}

analyzeShortSentences().catch(console.error)
