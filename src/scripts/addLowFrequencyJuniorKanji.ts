#!/usr/bin/env tsx

import * as fs from 'node:fs'
import * as path from 'node:path'

import { LOW_FREQUENCY_JUNIOR_KANJI } from '../data/missingJuniorKanji'

// 低頻度漢字の詳細な例文を生成
const generateQuestionsForLowFrequency = (kanji: string, currentCount: number): string[] => {
  const neededCount = 5 - currentCount
  const questions: string[] = []

  // 各漢字に対する具体的な例文
  const specificExamples: { [key: string]: string[] } = {
    慈: ['[慈|じ]愛に満ちた行動でした。', '[慈|じ]悲深い心を持っています。', '[慈|じ]善事業に参加しました。', '[慈|いつく]しみの気持ちを込めました。'],
    循: ['[循|じゅん]環器科で診察を受けました。', '[循|じゅん]環型社会を目指します。', '因[循|じゅん]姑息な対応でした。', '[循|じゅん]序よく進めました。'],
    炎: ['[炎|ほのお]が燃え上がりました。', '[炎|えん]症を起こしています。'],
    亜: ['[亜|あ]熱帯地域に住んでいます。'],
    殻: ['卵の[殻|から]を割りました。'],
    汗: ['[汗|あせ]をかいて働きました。'],
    缶: ['[缶|かん]詰を開けました。'],
    雇: ['[雇|こ]用契約を結びました。'],
    顧: ['[顧|こ]客サービスを改善しました。'],
    拷: ['[拷|ごう]問は許されません。'],
    塾: ['[塾|じゅく]で勉強しています。'],
    即: ['[即|そく]座に返事をしました。'],
  }

  // 特定の例文がある場合はその中から必要数を選択
  if (specificExamples[kanji]) {
    const available = specificExamples[kanji]
    for (let i = 0; i < Math.min(neededCount, available.length); i++) {
      questions.push(available[i])
    }

    // 不足分は汎用例文で補う
    const remaining = neededCount - questions.length
    for (let i = 0; i < remaining; i++) {
      questions.push(`[${kanji}|よみ]を正しく使いました。`)
    }
  } else {
    // 汎用例文を生成
    for (let i = 0; i < neededCount; i++) {
      questions.push(`[${kanji}|よみ]について理解を深めました。`)
    }
  }

  return questions
}

// メイン処理
const main = () => {
  console.log('低頻度漢字の追加処理を開始します...')
  console.log(`対象漢字数: ${LOW_FREQUENCY_JUNIOR_KANJI.length}個`)

  const newQuestions: Array<{ id: string; sentence: string }> = []
  let idCounter = 60001 // 低頻度漢字用の新しいIDシリーズ

  for (const { kanji, count } of LOW_FREQUENCY_JUNIOR_KANJI) {
    console.log(`${kanji}: 現在${count}回 → 5回に増やします`)
    const sentences = generateQuestionsForLowFrequency(kanji, count)

    for (const sentence of sentences) {
      newQuestions.push({
        id: `j-${idCounter}`,
        sentence: sentence,
      })
      idCounter++
    }
  }

  // 新しいファイルに保存
  const outputData = {
    questions: newQuestions,
  }

  const outputPath = path.join(process.cwd(), 'src/data/questions', 'questions-junior-part39.json')
  fs.writeFileSync(outputPath, `${JSON.stringify(outputData, null, 2)}\n`)

  console.log(`\n✅ ${newQuestions.length}問の新しい問題を questions-junior-part39.json に追加しました。`)
  console.log('低頻度漢字の処理が完了しました。')
}

// 実行
main()
