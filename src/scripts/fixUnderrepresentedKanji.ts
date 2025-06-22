import { readFileSync, writeFileSync } from 'node:fs'

import { EDUCATION_KANJI } from '../data/education-kanji'
import { getQuestionsByDifficulty } from '../services/questionService'
import type { QuestionInput } from '../types/question'

// 5回未満の漢字を自動的に修正
function fixUnderrepresentedKanji() {
  const allKanjiCount = new Map<string, number>()

  // 現在の使用回数をカウント
  for (let grade = 1; grade <= 6; grade++) {
    const questions = getQuestionsByDifficulty(`elementary${grade}` as any)

    questions.forEach((question) => {
      question.inputs.forEach((input: QuestionInput) => {
        if (input.kanji) {
          const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
          kanjiInAnswer.forEach((k) => {
            allKanjiCount.set(k, (allKanjiCount.get(k) || 0) + 1)
          })
        }
      })
    })
  }

  // 各学年で5回未満の漢字を特定し、問題を追加
  for (let grade = 1; grade <= 6; grade++) {
    const targetKanji = EDUCATION_KANJI[grade as keyof typeof EDUCATION_KANJI]
    const underrepresented: { kanji: string; count: number }[] = []

    targetKanji.forEach((kanji) => {
      const count = allKanjiCount.get(kanji) || 0
      if (count < 5) {
        underrepresented.push({ kanji, count })
      }
    })

    if (underrepresented.length === 0) continue

    // 既存のファイルを読み込み
    const filePath = `/home/unok/git/daily-kanji/daily-kanji/src/data/questions-elementary${grade}.json`
    const data = JSON.parse(readFileSync(filePath, 'utf8'))
    const existingCount = data.questions.length

    // 追加する問題を生成
    const additionalQuestions: any[] = []
    let questionId = existingCount + 1

    // 各漢字について、5回になるまで問題を追加
    underrepresented.forEach(({ kanji, count }) => {
      const needed = 5 - count
      for (let i = 0; i < needed; i++) {
        additionalQuestions.push({
          id: `e${grade}-${questionId++}`,
          sentence: generateSentence(kanji, grade),
        })
      }
    })

    // ファイルを更新
    data.questions = [...data.questions, ...additionalQuestions]
    writeFileSync(filePath, JSON.stringify(data, null, 2))
  }
}

// 学年に応じた例文を生成（簡易版）
function generateSentence(kanji: string, _grade: number): string {
  // よく使われる読み方パターン
  const commonReadings: Record<string, string[]> = {
    // 5年生の漢字
    富: ['とみ', 'ふ'],
    居: ['い', 'きょ'],
    属: ['ぞく'],
    布: ['ぬの', 'ふ'],
    幹: ['みき', 'かん'],
    序: ['じょ'],
    弁: ['べん'],
    往: ['おう'],
    復: ['ふく'],
    応: ['おう'],
    快: ['かい'],
    恩: ['おん'],
    情: ['じょう'],
    態: ['たい'],
    慣: ['かん'],
    承: ['しょう'],
    技: ['ぎ'],
    招: ['しょう'],
    授: ['じゅ'],
    採: ['さい'],
    接: ['せつ'],
    提: ['てい'],
    損: ['そん'],
    支: ['し'],
    政: ['せい'],
    故: ['こ'],
    敵: ['てき'],
    断: ['だん'],
    旧: ['きゅう'],
    易: ['い'],
    暴: ['ぼう'],
    条: ['じょう'],
    枝: ['えだ', 'し'],
    査: ['さ'],
    格: ['かく'],
    桜: ['さくら'],
    検: ['けん'],
    構: ['こう'],
    武: ['ぶ'],
    比: ['ひ'],
    永: ['えい'],
    河: ['かわ', 'か'],
    液: ['えき'],
    混: ['こん'],
    減: ['げん'],
    測: ['そく'],
    準: ['じゅん'],
    演: ['えん'],
    潔: ['けつ'],
    災: ['さい'],
    燃: ['ねん'],
    版: ['はん'],
    犯: ['はん'],
    状: ['じょう'],
    独: ['どく'],
    率: ['りつ'],
    現: ['げん'],
    留: ['りゅう'],
    略: ['りゃく'],
    益: ['えき'],
    眼: ['がん'],
    破: ['は'],
    確: ['かく'],
    示: ['し'],
    祖: ['そ'],
    禁: ['きん'],
    移: ['い'],
    程: ['てい'],
    税: ['ぜい'],
    築: ['ちく'],
    精: ['せい'],
    素: ['そ'],
    経: ['けい'],
    統: ['とう'],
    絶: ['ぜつ'],
    綿: ['めん'],
    総: ['そう'],
    編: ['へん'],
    績: ['せき'],
    織: ['しき'],
    罪: ['つみ', 'ざい'],
    群: ['ぐん'],
    義: ['ぎ'],
    耕: ['こう'],
    職: ['しょく'],
    肥: ['ひ'],
    能: ['のう'],
    興: ['きょう'],
    舌: ['した', 'ぜつ'],
    舎: ['しゃ'],
    術: ['じゅつ'],
    衛: ['えい'],
    製: ['せい'],
    複: ['ふく'],
    規: ['き'],
    解: ['かい'],
    設: ['せつ'],
    許: ['きょ'],
    証: ['しょう'],
    評: ['ひょう'],
    講: ['こう'],
    謝: ['しゃ'],
    識: ['しき'],
    護: ['ご'],
    豊: ['ほう'],
    財: ['ざい'],
    貧: ['ひん'],
    責: ['せき'],
    貸: ['たい'],
    貿: ['ぼう'],
    賀: ['が'],
    資: ['し'],
    賛: ['さん'],
    質: ['しつ'],
    輸: ['ゆ'],
    述: ['じゅつ'],
    迷: ['めい'],
    退: ['たい'],
    逆: ['ぎゃく'],
    造: ['ぞう'],
    過: ['か'],
    適: ['てき'],
    酸: ['さん'],
    鉱: ['こう'],
    銅: ['どう'],
    銭: ['せん'],
    防: ['ぼう'],
    限: ['げん'],
    険: ['けん'],
    際: ['さい'],
    雑: ['ざつ'],
    非: ['ひ'],
    預: ['よ'],
    領: ['りょう'],
    額: ['がく'],
    飼: ['し'],
  }

  const readings = commonReadings[kanji] || ['よみ']
  const reading = readings[0]

  // 簡単な例文パターン
  return `[${kanji}|${reading}]を使います。`
}
fixUnderrepresentedKanji()
