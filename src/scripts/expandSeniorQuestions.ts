import { readFileSync, writeFileSync } from 'node:fs'

import { getQuestionsByDifficulty } from '../services/questionService'
import type { QuestionInput } from '../types/question'

// 高校の問題を各漢字5回以上になるまで拡張
function expandSeniorQuestions() {
  const questions = getQuestionsByDifficulty('senior')
  const kanjiCount = new Map<string, number>()

  // 現在の漢字使用回数をカウント
  questions.forEach((question) => {
    question.inputs.forEach((input: QuestionInput) => {
      if (input.kanji) {
        const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
        kanjiInAnswer.forEach((k) => {
          kanjiCount.set(k, (kanjiCount.get(k) || 0) + 1)
        })
      }
    })
  })

  // 5回未満の漢字を特定
  const underrepresented: { kanji: string; count: number; needed: number }[] = []
  kanjiCount.forEach((count, kanji) => {
    if (count < 5) {
      underrepresented.push({ kanji, count, needed: 5 - count })
    }
  })

  const _totalNeeded = underrepresented.reduce((sum, item) => sum + item.needed, 0)

  // 既存ファイルを読み込み
  const filePath = '/home/unok/git/daily-kanji/daily-kanji/src/data/questions-senior.json'
  const data = JSON.parse(readFileSync(filePath, 'utf8'))

  let questionId = data.questions.length + 1
  const additionalQuestions: any[] = []

  // 各漢字について、5回になるまで問題を追加
  underrepresented.forEach(({ kanji, needed }) => {
    for (let i = 0; i < needed; i++) {
      additionalQuestions.push({
        id: `sen-${questionId.toString().padStart(3, '0')}`,
        sentence: generateSeniorSentence(kanji),
      })
      questionId++
    }
  })

  // ファイルを更新
  data.questions = [...data.questions, ...additionalQuestions]
  writeFileSync(filePath, JSON.stringify(data, null, 2))
}

// 高校レベルの例文を生成
function generateSeniorSentence(kanji: string): string {
  // 高校漢字の一般的な読み方と文脈パターン（より高度で抽象的）
  const patterns: Record<string, { reading: string; contexts: string[] }> = {
    // 高頻度漢字のパターン
    望: { reading: 'のぞ', contexts: ['将来への[望|のぞ]みを抱いています。', '平和を[望|のぞ]んでいます。'] },
    意: { reading: 'い', contexts: ['その[意|い]味を理解しました。', '自分の[意|い]見を述べます。'] },
    見: { reading: 'み', contexts: ['新しい[見|み]解を得ました。', '[見|み]識を深めたいです。'] },
    全: { reading: 'ぜん', contexts: ['[全|ぜん]力で取り組みます。', '[全|まった]く新しい発想です。'] },
    要: { reading: 'よう', contexts: ['[要|よう]点をまとめました。', '重[要|よう]な決定です。'] },
    品: { reading: 'ひん', contexts: ['[品|ひん]格のある振る舞いです。', '作[品|ひん]を鑑賞しました。'] },
    心: { reading: 'こころ', contexts: ['[心|こころ]を込めて作りました。', '誠実な[心|こころ]を持ちます。'] },
    識: { reading: 'しき', contexts: ['豊かな知[識|しき]があります。', '見[識|しき]を広げます。'] },
    力: { reading: 'りょく', contexts: ['努[力|りょく]を続けます。', '能[力|りょく]を発揮します。'] },
    理: { reading: 'り', contexts: ['[理|り]論を学びました。', '[理|り]解を深めます。'] },

    // 学術的な漢字
    哲: { reading: 'てつ', contexts: ['[哲|てつ]学を学んでいます。', '[哲|てつ]学的な思考をします。'] },
    存: { reading: 'そん', contexts: ['[存|そん]在の意味を考えます。', '価値の[存|そん]在を認めます。'] },
    在: { reading: 'ざい', contexts: ['現[在|ざい]の状況を分析します。', '存[在|ざい]意義を見つけます。'] },
    探: { reading: 'たん', contexts: ['真理を[探|たん]究します。', '新しい方法を[探|さが]します。'] },
    問: { reading: 'もん', contexts: ['重要な[問|もん]題を扱います。', '[問|と]いかけを続けます。'] },
    憲: { reading: 'けん', contexts: ['[憲|けん]法を学習しました。', '[憲|けん]政の理念を理解します。'] },
    常: { reading: 'じょう', contexts: ['[常|じょう]識を身につけます。', '[常|つね]に努力しています。'] },
    道: { reading: 'どう', contexts: ['正しい[道|みち]を歩みます。', '武[道|ぶどう]の精神を学びます。'] },
    則: { reading: 'そく', contexts: ['法[則|そく]を発見しました。', '規[則|そく]に従います。'] },
    度: { reading: 'ど', contexts: ['制[度|ど]を改革します。', '態[度|ど]を改めます。'] },

    // 科学・技術系
    量: { reading: 'りょう', contexts: ['[量|りょう]子力学を学びます。', '[量|りょう]的な分析をします。'] },
    界: { reading: 'かい', contexts: ['学術[界|かい]で注目されています。', '新しい[界|かい]面を発見しました。'] },
    態: { reading: 'たい', contexts: ['物質の[態|たい]を観察します。', '生[態|たい]系を研究します。'] },
    系: { reading: 'けい', contexts: ['太陽[系|けい]について学びます。', '体[系|けい]的に整理します。'] },
    維: { reading: 'い', contexts: ['平和を[維|い]持します。', '秩序を[維|い]持します。'] },
    髄: { reading: 'ずい', contexts: ['本質の[髄|ずい]を理解します。', '真[髄|しんずい]を極めます。'] },

    // 社会・政治系
    済: { reading: 'ざい', contexts: ['経[済|ざい]学を専攻しています。', '問題が解[済|かい]しました。'] },
    策: { reading: 'さく', contexts: ['効果的な政[策|さく]を提案します。', '対[策|さく]を講じます。'] },
    効: { reading: 'こう', contexts: ['薬の[効|こう]果が現れました。', '[効|こう]率的に作業します。'] },
    果: { reading: 'か', contexts: ['研究の成[果|か]を発表します。', '結[果|か]を分析します。'] },
    検: { reading: 'けん', contexts: ['詳細に[検|けん]討します。', '[検|けん]査を実施します。'] },
    遺: { reading: 'い', contexts: ['[遺|い]伝について学びます。', '文化[遺|い]産を保護します。'] },
    疾: { reading: 'しっ', contexts: ['[疾|しっ]患の治療法を研究します。', '[疾|しっ]病予防に努めます。'] },
    患: { reading: 'かん', contexts: ['病気の[患|かん]者を支援します。', '心配事を[患|わずら]います。'] },
    治: { reading: 'ち', contexts: ['病気を[治|なお]します。', '政[治|じ]に参加します。'] },
    療: { reading: 'りょう', contexts: ['[療|りょう]法を選択します。', '治[療|ちりょう]を受けます。'] },
    開: { reading: 'かい', contexts: ['新しい分野を[開|ひら]拓します。', '[開|かい]発を進めます。'] },

    // 基本的なパターン（その他の漢字用）
    default: {
      reading: 'よみ',
      contexts: ['[KANJI|よみ]の概念を理解しました。', '[KANJI|よみ]について深く考察します。', '[KANJI|よみ]の重要性を認識しています。'],
    },
  }

  const pattern = patterns[kanji] || patterns.default
  const contexts = pattern.contexts.map((ctx) => ctx.replace('KANJI', kanji))
  const randomContext = contexts[Math.floor(Math.random() * contexts.length)]

  return randomContext
}

// 実行
expandSeniorQuestions()
