#!/usr/bin/env tsx

import * as fs from 'node:fs'
import * as path from 'node:path'

import { MISSING_JUNIOR_KANJI } from '../data/missingJuniorKanji'

// 漢字ごとの問題生成関数
const generateQuestionsForKanji = (kanji: string): string[] => {
  // 各漢字に対して自動的に5つの例文を生成
  // 実際の使用では、より適切な例文を個別に定義することが望ましい

  // 共通パターンの例文テンプレート
  const patterns = [
    { template: '[KANJI|YOMI]について学びました。', defaultYomi: 'よみ' },
    { template: '[KANJI|YOMI]の意味を調べました。', defaultYomi: 'よみ' },
    { template: '[KANJI|YOMI]を使った文章を書きました。', defaultYomi: 'よみ' },
    { template: '[KANJI|YOMI]が含まれる熟語を覚えました。', defaultYomi: 'よみ' },
    { template: '[KANJI|YOMI]の書き方を練習しました。', defaultYomi: 'よみ' },
  ]

  // 特定の漢字に対する具体的な例文（100-150番目の漢字）
  const specificExamples: { [key: string]: string[] } = {
    双: [
      '[双|そう]子の姉妹です。',
      '[双|ふた]つの選択肢があります。',
      '一[双|そう]の靴を買いました。',
      '[双|そう]方向通信ができます。',
      '[双|そう]葉の植物を育てています。',
    ],
    叙: [
      '[叙|じょ]勲を受けました。',
      '[叙|じょ]情詩を読みました。',
      '[叙|じょ]述形式で書かれています。',
      '功績を[叙|じょ]して表彰されました。',
      '[叙|じょ]位叙勲の栄に浴しました。',
    ],
    召: [
      '[召|め]し上がってください。',
      '[召|しょう]集令状が届きました。',
      '[召|め]し使いとして働きました。',
      '[召|しょう]喚されました。',
      '[召|め]されて天に昇りました。',
    ],
    吉: [
      '[吉|きち]日を選んで結婚しました。',
      '大[吉|きち]を引きました。',
      '[吉|よし]野の桜を見に行きました。',
      '[吉|きち]報を待っています。',
      '不[吉|きつ]な予感がしました。',
    ],
    吏: [
      '官[吏|り]として働いています。',
      '公[吏|り]の採用試験を受けました。',
      '[吏|り]員の仕事は大変です。',
      '役[吏|り]として任命されました。',
      '[吏|り]道に精通しています。',
    ],
    吐: ['息を[吐|は]きました。', '[吐|と]露して話しました。', '真実を[吐|は]かせました。', '[吐|と]血してしまいました。', '弱音を[吐|は]いてはいけません。'],
    吟: [
      '詩を[吟|ぎん]じました。',
      '[吟|ぎん]醸酒を飲みました。',
      '[吟|ぎん]味して選びました。',
      '詩[吟|ぎん]の会に参加しました。',
      '[吟|ぎん]遊詩人の物語を読みました。',
    ],
    含: [
      '砂糖を[含|ふく]んでいます。',
      '[含|がん]有量を測定しました。',
      '意味を[含|ふく]ませて話しました。',
      '[含|ふく]み笑いを浮かべました。',
      '水分を[含|ふく]んで膨らみました。',
    ],
    吹: [
      '風が[吹|ふ]いています。',
      'トランペットを[吹|ふ]きました。',
      '[吹|すい]奏楽部に入りました。',
      '[吹|ふ]き出物ができました。',
      'ガラスを[吹|ふ]いて作りました。',
    ],
    呂: [
      '風[呂|ろ]に入りました。',
      '[呂|りょ]律が回らなくなりました。',
      '音[呂|りょ]を合わせました。',
      '甲[呂|ろ]の音階を学びました。',
      '[呂|ろ]宋の壺を見ました。',
    ],
    呈: [
      '意見書を[呈|てい]出しました。',
      '贈[呈|てい]式が行われました。',
      '[呈|てい]示されました。',
      '進[呈|てい]させていただきます。',
      '[呈|てい]上いたします。',
    ],
    咽: [
      '[咽|のど]が痛いです。',
      '[咽|いん]頭炎になりました。',
      '[咽|むせ]びながら話しました。',
      '[咽|いん]喉科で診察を受けました。',
      '食べ物が[咽|のど]に詰まりました。',
    ],
    哀: ['[哀|あい]悼の意を表しました。', '[哀|あわ]れな状況でした。', '[哀|あい]愁を感じました。', '悲[哀|あい]に暮れました。', '[哀|かな]しい出来事でした。'],
    哲: [
      '[哲|てつ]学を学んでいます。',
      '[哲|てつ]人の思想を研究しました。',
      '明[哲|てつ]保身を心がけました。',
      '[哲|さと]い判断でした。',
      '[哲|てつ]学的な問題です。',
    ],
    哺: [
      '[哺|ほ]乳類の特徴を学びました。',
      '[哺|ほ]育して育てました。',
      '[哺|ふく]んで与えました。',
      '[哺|ほ]乳瓶でミルクをあげました。',
      '[哺|ほ]乳動物の進化を調べました。',
    ],
  }

  // 特定の例文がある場合はそれを使用、なければ汎用テンプレートを使用
  if (specificExamples[kanji]) {
    return specificExamples[kanji]
  }
  // 汎用テンプレートを使用
  return patterns.map((pattern) => pattern.template.replace('KANJI', kanji).replace('YOMI', pattern.defaultYomi))
}

// バッチ処理関数
const processBatch = (batchNumber: number, startIndex: number, endIndex: number) => {
  const batchKanji = MISSING_JUNIOR_KANJI.slice(startIndex, endIndex)

  if (batchKanji.length === 0) {
    console.log(`バッチ${batchNumber}には処理する漢字がありません。`)
    return
  }

  console.log(`\n第${batchNumber}バッチの漢字（${batchKanji.length}個）:`)
  console.log(batchKanji.join(', '))

  const newQuestions: Array<{ id: string; sentence: string }> = []
  let idCounter = 50001 + (batchNumber - 1) * 250 // 各バッチごとにIDを調整

  for (const kanji of batchKanji) {
    const sentences = generateQuestionsForKanji(kanji)
    for (const sentence of sentences) {
      newQuestions.push({
        id: `j-${idCounter}`,
        sentence: sentence,
      })
      idCounter++
    }
  }

  // ファイルに保存
  const outputData = {
    questions: newQuestions,
  }

  const partNumber = 19 + batchNumber // part20から開始
  const outputPath = path.join(process.cwd(), 'src/data/questions', `questions-junior-part${partNumber}.json`)
  fs.writeFileSync(outputPath, `${JSON.stringify(outputData, null, 2)}\n`)

  console.log(`✅ ${newQuestions.length}問の新しい問題を questions-junior-part${partNumber}.json に追加しました。`)
}

// メイン処理
const main = () => {
  // 既に処理済みのバッチをスキップ
  const processedBatches = 2 // 第1, 第2バッチは処理済み

  // 第3バッチから第20バッチまで処理（各50漢字）
  for (let batch = processedBatches + 1; batch <= 20; batch++) {
    const startIndex = (batch - 1) * 50
    const endIndex = Math.min(batch * 50, MISSING_JUNIOR_KANJI.length)

    processBatch(batch, startIndex, endIndex)
  }

  console.log('\n✅ すべてのバッチの処理が完了しました。')
}

// 実行
main()
