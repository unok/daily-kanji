import * as fs from 'fs/promises'
import * as path from 'path'

interface Question {
  id: string
  sentence: string
}

interface QuestionFile {
  questions: Question[]
}

// 短い文章を自然に拡張するための修正パターン
const expansionPatterns: Record<string, (sentence: string) => string> = {
  // 具体的なパターン
  '本を読みました。': () => '昨日[本|ほん]を[読|よ]みました。',
  '字を書きました。': () => '丁寧に[字|じ]を[書|か]きました。',
  '用じがあります。': () => '大事な[用|よう]じがあります。',
  '本を買いました。': () => '新しい[本|ほん]を[買|か]いました。',
  '明るい昼まです。': () => 'とても[明|あか]るい[昼|ひる]まです。',
  '店に入りました。': () => '古い[店|みせ]に[入|はい]りました。',
  'あした行きます。': () => 'あした学校に[行|い]きます。',
  '強く引きました。': () => 'ロープを[強|つよ]く[引|ひ]きました。',
  '図をかきました。': () => '分かりやすい[図|ず]をかきました。',
  '近所の人です。': () => '親切な[近|きん]所の人です。',
  '午前様です。': () => '今は[午|ご]前様の時間です。',

  // 動詞パターン
  'しました。': (sentence: string) => {
    const patterns = [`昨日${sentence}`, `みんなで${sentence}`, `初めて${sentence}`, `一生懸命${sentence}`]
    return patterns[Math.floor(Math.random() * patterns.length)]
  },

  '思います。': (sentence: string) => {
    return `私も${sentence}`
  },

  'います。': (sentence: string) => {
    if (sentence.includes('あり')) {
      return sentence.replace('あります。', 'たくさんあります。')
    }
    return `今も${sentence}`
  },

  'ます。': (sentence: string) => {
    if (sentence.includes('行き')) {
      return sentence.replace('行きます。', '一緒に行きます。')
    }
    if (sentence.includes('あり')) {
      return sentence.replace('あります。', 'いつもあります。')
    }
    return `明日も${sentence}`
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
      // 特定のパターンを探す
      for (const [pattern, transformer] of Object.entries(expansionPatterns)) {
        if (cleanSentence === pattern || cleanSentence.endsWith(pattern)) {
          const newSentence = transformer(cleanSentence)
          if (newSentence !== cleanSentence) {
            const newClean = newSentence.replace(/\[[^\]]+\|[^\]]+\]/g, (m) => m.split('|')[0].slice(1))
            if (newClean.length >= 9) {
              console.log(`  ✅ ID: ${q.id}`)
              console.log(`     旧: ${cleanSentence} (${cleanSentence.length}文字)`)
              console.log(`     新: ${newClean} (${newClean.length}文字)`)
              fixedCount++
              return { ...q, sentence: newSentence }
            }
          }
        }
      }

      // 汎用的な拡張
      if (cleanSentence.length <= 8) {
        let newSentence = q.sentence

        // 基本的な拡張パターン
        if (cleanSentence.endsWith('です。')) {
          if (cleanSentence.includes('の')) {
            newSentence = q.sentence.replace('です。', 'なのです。')
          } else {
            newSentence = `それは${q.sentence}`
          }
        } else if (cleanSentence.endsWith('した。')) {
          const prefixes = ['昨日', '今朝', '先週', 'みんなで', '急いで']
          const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
          newSentence = `${prefix}${q.sentence}`
        } else if (cleanSentence.includes('を')) {
          const modifiers = ['丁寧に', 'ゆっくり', '注意深く', '素早く']
          const modifier = modifiers[Math.floor(Math.random() * modifiers.length)]
          newSentence = q.sentence.replace(/を/, `を${modifier}`)
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
  const targetFiles = [
    'questions-elementary2-part1.json',
    'questions-elementary2-part2.json',
    'questions-elementary2-part3.json',
    'questions-elementary2-part4.json',
    'questions-elementary2-part5.json',
  ]

  console.log('🔧 小学2年生の短い文章の修正を開始します...\n')

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
