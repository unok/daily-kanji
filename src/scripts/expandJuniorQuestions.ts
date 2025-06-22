import { readFileSync, writeFileSync } from 'node:fs'

import { getQuestionsByDifficulty } from '../services/questionService'

// 中学校の問題を各漢字5回以上になるまで拡張
function expandJuniorQuestions() {
  const questions = getQuestionsByDifficulty('junior')
  const kanjiCount = new Map<string, number>()

  // 現在の漢字使用回数をカウント
  for (const question of questions) {
    for (const input of question.inputs) {
      if (input.kanji) {
        const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
        for (const k of kanjiInAnswer) {
          kanjiCount.set(k, (kanjiCount.get(k) || 0) + 1)
        }
      }
    }
  }

  // 5回未満の漢字を特定
  const underrepresented: { kanji: string; count: number; needed: number }[] = []
  for (const [kanji, count] of kanjiCount.entries()) {
    if (count < 5) {
      underrepresented.push({ kanji, count, needed: 5 - count })
    }
  }

  // const _totalNeeded = underrepresented.reduce((sum, item) => sum + item.needed, 0)

  // 既存ファイルを読み込み
  const filePath = '/home/unok/git/daily-kanji/daily-kanji/src/data/questions/questions-junior.json'
  const data = JSON.parse(readFileSync(filePath, 'utf8'))

  let questionId = data.questions.length + 1
  const additionalQuestions: { id: string; sentence: string }[] = []

  // 各漢字について、5回になるまで問題を追加
  for (const { kanji, needed } of underrepresented) {
    for (let i = 0; i < needed; i++) {
      additionalQuestions.push({
        id: `jun-${questionId.toString().padStart(3, '0')}`,
        sentence: generateJuniorSentence(kanji),
      })
      questionId++
    }
  }

  // ファイルを更新
  data.questions = [...data.questions, ...additionalQuestions]
  writeFileSync(filePath, JSON.stringify(data, null, 2))
}

// 中学校レベルの例文を生成
function generateJuniorSentence(kanji: string): string {
  // 中学校漢字の一般的な読み方と文脈パターン
  const patterns: Record<string, { reading: string; contexts: string[] }> = {
    // よく使われる漢字のパターン
    亜: { reading: 'あ', contexts: ['[亜|あ]細亜の国々を学びました。', '[亜|あ]熱帯気候について調べました。'] },
    愛: { reading: 'あい', contexts: ['家族への[愛|あい]を大切にします。', '[愛|あい]情深い人です。'] },
    悪: { reading: 'わる', contexts: ['[悪|わる]いことはしてはいけません。', '[悪|あく]意はありませんでした。'] },
    握: { reading: 'にぎ', contexts: ['手を固く[握|にぎ]りました。', 'ハンドルを[握|にぎ]って運転します。'] },
    圧: { reading: 'あつ', contexts: ['高い[圧|あつ]力がかかります。', '血[圧|あつ]を測定しました。'] },
    扱: { reading: 'あつか', contexts: ['機械を丁寧に[扱|あつか]います。', '慎重に[扱|あつか]ってください。'] },
    宛: { reading: 'あ', contexts: ['手紙を友人[宛|あ]てに送りました。', '[宛|あ]先を確認してください。'] },
    嵐: { reading: 'あらし', contexts: ['激しい[嵐|あらし]が過ぎました。', '[嵐|あらし]の夜でした。'] },
    以: { reading: 'い', contexts: ['[以|い]前にも来たことがあります。', 'これ[以|い]上は無理です。'] },
    易: { reading: 'やさ', contexts: ['この問題は[易|やさ]しいです。', '[易|い]しく説明してください。'] },

    // さらに追加
    液: { reading: 'えき', contexts: ['血[液|えき]の循環について学びました。', '燃料[液|えき]を補給します。'] },
    演: { reading: 'えん', contexts: ['劇を[演|えん]じました。', 'ピアノを[演|えん]奏します。'] },
    億: { reading: 'おく', contexts: ['人口が一[億|おく]人を超えました。', '[億|おく]という大きな数です。'] },
    往: { reading: 'おう', contexts: ['[往|おう]復切符を買いました。', '[往|い]き道で友達に会いました。'] },
    応: { reading: 'おう', contexts: ['質問に[応|おう]じて答えました。', '要求に[応|おう]えます。'] },
    移: { reading: 'うつ', contexts: ['新しい場所に[移|うつ]りました。', '本社を[移|い]転しました。'] },
    因: { reading: 'いん', contexts: ['失敗の[因|いん]を考えました。', '原[因|いん]を調べます。'] },
    永: { reading: 'なが', contexts: ['[永|なが]い間待っていました。', '[永|えい]遠の愛を誓いました。'] },
    営: { reading: 'えい', contexts: ['店を[営|えい]んでいます。', '会社を[営|いとな]んでいます。'] },
    衛: { reading: 'まも', contexts: ['国境を[衛|まも]る仕事です。', '自分の身を[衛|まも]ります。'] },

    // 基本的なパターン（その他の漢字用）
    default: { reading: 'よみ', contexts: ['[KANJI|よみ]について学びました。', '[KANJI|よみ]を使って文を作ります。'] },
  }

  const pattern = patterns[kanji] || patterns.default
  const contexts = pattern.contexts.map((ctx) => ctx.replace('KANJI', kanji))
  const randomContext = contexts[Math.floor(Math.random() * contexts.length)]

  return randomContext
}

// 実行
expandJuniorQuestions()
