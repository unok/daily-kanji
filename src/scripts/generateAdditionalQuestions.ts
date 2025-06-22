import { readFileSync, writeFileSync } from 'node:fs'

import { EDUCATION_KANJI } from '../data/kanji-lists/education-kanji'
import { type DifficultyLevel, getQuestionsByDifficulty } from '../services/questionService'

// 使用回数が少ない漢字を特定して追加問題を生成
function generateAdditionalQuestions() {
  const allKanjiCount = new Map<string, number>()

  // 現在の使用回数をカウント
  for (let grade = 1; grade <= 6; grade++) {
    const questions = getQuestionsByDifficulty(`elementary${grade}` as DifficultyLevel)

    for (const question of questions) {
      for (const input of question.inputs) {
        if (input.kanji) {
          const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
          for (const k of kanjiInAnswer) {
            allKanjiCount.set(k, (allKanjiCount.get(k) || 0) + 1)
          }
        }
      }
    }
  }

  // 各学年で5回未満の漢字を特定
  for (let grade = 1; grade <= 6; grade++) {
    const targetKanji = EDUCATION_KANJI[grade as keyof typeof EDUCATION_KANJI]
    const underrepresented: { kanji: string; count: number }[] = []

    for (const kanji of targetKanji) {
      const count = allKanjiCount.get(kanji) || 0
      if (count < 5) {
        underrepresented.push({ kanji, count })
      }
    }

    if (underrepresented.length === 0) continue

    // 既存のファイルを読み込み
    const filePath = `/home/unok/git/daily-kanji/daily-kanji/src/data/questions/questions-elementary${grade}.json`
    const data = JSON.parse(readFileSync(filePath, 'utf8'))
    const existingCount = data.questions.length

    // 追加する問題を生成
    const additionalQuestions: { id: string; sentence: string }[] = []
    let questionId = existingCount + 1

    // 各漢字について、5回になるまで問題を追加
    for (const { kanji, count } of underrepresented) {
      const needed = 5 - count
      for (let i = 0; i < needed; i++) {
        additionalQuestions.push({
          id: `e${grade}-${questionId++}`,
          sentence: generateSentence(kanji, grade),
        })
      }
    }

    // ファイルを更新
    data.questions = [...data.questions, ...additionalQuestions]
    writeFileSync(filePath, JSON.stringify(data, null, 2))
  }
}

// 学年に応じた例文を生成
function generateSentence(kanji: string, _grade: number): string {
  // 簡単な例文パターン（実際の実装では、より多様なパターンを使用）
  const patterns: Record<string, string[]> = {
    // 1年生の例
    夕: ['[夕|ゆう]方に帰ります。', '[夕|ゆう]ごはんを食べます。', '[夕|ゆう]日がきれいです。'],
    文: ['[文|ぶん]を書きます。', '[文|ぶん]章を読みます。', '[文|もん]字を習います。'],
    字: ['[字|じ]を書きます。', '漢[字|じ]を勉強します。', '[字|じ]が上手です。'],
    校: ['学[校|こう]に行きます。', '[校|こう]庭で遊びます。', '[校|こう]長先生です。'],
    村: ['[村|むら]に住んでいます。', '[村|むら]の祭りです。', '[村|むら]長さんです。'],
    町: ['[町|まち]に買い物に行きます。', '[町|まち]の中心です。', '[町|ちょう]内会があります。'],
    森: ['[森|もり]を散歩します。', '[森|もり]の中は涼しいです。', '[森|もり]に動物がいます。'],
    正: ['[正|ただ]しい答えです。', '[正|せい]解です。', '[正|しょう]月が来ます。'],
    火: ['[火|ひ]をつけます。', '[火|か]曜日です。', '[火|ひ]事に注意します。'],
    玉: ['[玉|たま]を投げます。', '[玉|たま]ねぎを切ります。', '[玉|ぎょく]のように美しいです。'],
    王: ['[王|おう]様の話です。', '[王|おう]子様が来ました。', '[王|おう]国に住んでいます。'],
    竹: ['[竹|たけ]が生えています。', '[竹|たけ]の子を食べます。', '[竹|たけ]で作りました。'],
    貝: ['[貝|かい]を拾いました。', '[貝|かい]殻を集めます。', '[貝|かい]を食べます。'],
    金: ['お[金|かね]を払います。', '[金|きん]メダルです。', '[金|きん]曜日に会います。'],
    // 6年生の例
    除: ['[除|じょ]外します。', '掃[除|じ]をします。', '[除|のぞ]きます。'],
  }

  // パターンがある場合はそれを使用
  if (patterns[kanji]) {
    return patterns[kanji][Math.floor(Math.random() * patterns[kanji].length)]
  }

  // デフォルトパターン
  return `[${kanji}|よみ]を使います。`
}
generateAdditionalQuestions()
