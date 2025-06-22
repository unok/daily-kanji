#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'node:fs'

import { getAllElementaryKanji } from '../data/kanji-lists/education-kanji'
import { parseQuestion } from '../utils/questionParser'

interface Question {
  id: string
  sentence: string
}

interface QuestionsData {
  questions: Question[]
}

// 各学年の漢字使用回数をカウント
function countKanjiUsage(grade: number): Map<string, number> {
  const filePath = `/home/unok/git/daily-kanji/daily-kanji/src/data/questions/questions-elementary${grade}.json`
  const data: QuestionsData = JSON.parse(readFileSync(filePath, 'utf8'))
  const kanjiCount = new Map<string, number>()

  for (const question of data.questions) {
    const parsed = parseQuestion(question.sentence)
    for (const input of parsed.inputs) {
      if (input.kanji) {
        const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
        for (const k of kanjiInAnswer) {
          kanjiCount.set(k, (kanjiCount.get(k) || 0) + 1)
        }
      }
    }
  }

  return kanjiCount
}

// 5回未満の漢字を特定
function findUnderrepresentedKanji(grade: number): { kanji: string; count: number; needed: number }[] {
  const kanjiCount = countKanjiUsage(grade)
  const targetKanji = getAllElementaryKanji()[grade - 1]
  const underrepresented: { kanji: string; count: number; needed: number }[] = []

  for (const kanji of targetKanji) {
    const count = kanjiCount.get(kanji) || 0
    if (count < 5) {
      underrepresented.push({ kanji, count, needed: 5 - count })
    }
  }

  return underrepresented
}

// 学年別の漢字パターン
const kanjiPatterns: Record<number, Record<string, { readings: string[]; patterns: string[] }>> = {
  1: {
    間: { readings: ['かん', 'あいだ', 'ま'], patterns: ['時[間|かん]がありません。', '[間|あいだ]に入りました。', '[間|ま]に合いました。'] },
    札: { readings: ['さつ', 'ふだ'], patterns: ['お[札|さつ]を数えます。', '名[札|ふだ]を付けました。'] },
    朝: { readings: ['あさ', 'ちょう'], patterns: ['[朝|あさ]早く起きました。', '[朝|ちょう]食を食べました。'] },
    葉: { readings: ['は', 'よう'], patterns: ['木の[葉|は]が落ちました。', '紅[葉|よう]を見ました。'] },
    書: { readings: ['か', 'しょ'], patterns: ['手紙を[書|か]きました。', '図[書|しょ]館に行きました。'] },
  },
  2: {
    多: { readings: ['おお', 'た'], patterns: ['[多|おお]くの人が来ました。', '[多|た]数決で決めました。'] },
    広: { readings: ['ひろ', 'こう'], patterns: ['[広|ひろ]い部屋です。', '[広|こう]場で遊びました。'] },
    交: { readings: ['まじ', 'こう'], patterns: ['[交|まじ]わりました。', '[交|こう]通ルールを守ります。'] },
    計: { readings: ['はか', 'けい'], patterns: ['時間を[計|はか]りました。', '[計|けい]算しました。'] },
    直: { readings: ['なお', 'ちょく'], patterns: ['[直|なお]しました。', '[直|ちょく]線を引きました。'] },
  },
  3: {
    世: { readings: ['よ', 'せい'], patterns: ['[世|よ]の中のことです。', '[世|せい]界を旅しました。'] },
    使: { readings: ['つか', 'し'], patterns: ['道具を[使|つか]いました。', '大[使|し]館に行きました。'] },
    医: { readings: ['い'], patterns: ['[医|い]者に診てもらいました。', '[医|い]学を学びました。'] },
    向: { readings: ['む', 'こう'], patterns: ['前を[向|む]きました。', '[向|こう]上心があります。'] },
    味: { readings: ['あじ', 'み'], patterns: ['良い[味|あじ]でした。', '興[味|み]があります。'] },
  },
  4: {
    仲: { readings: ['なか'], patterns: ['[仲|なか]が良いです。', '[仲|なか]間と遊びました。'] },
    伝: { readings: ['つた', 'でん'], patterns: ['[伝|つた]えました。', '[伝|でん]統を守ります。'] },
    差: { readings: ['さ'], patterns: ['[差|さ]がありました。', '時[差|さ]があります。'] },
    必: { readings: ['かなら', 'ひつ'], patterns: ['[必|かなら]ず行きます。', '[必|ひつ]要なものです。'] },
    戦: { readings: ['たたか', 'せん'], patterns: ['[戦|たたか]いました。', '[戦|せん]争はいけません。'] },
  },
  5: {
    報: { readings: ['ほう'], patterns: ['[報|ほう]告しました。', '情[報|ほう]を集めました。'] },
    測: { readings: ['はか', 'そく'], patterns: ['長さを[測|はか]りました。', '[測|そく]定しました。'] },
    肝: { readings: ['きも', 'かん'], patterns: ['[肝|きも]が据わっています。', '[肝|かん]臓の検査をしました。'] },
    衆: { readings: ['しゅう'], patterns: ['大[衆|しゅう]の前で話しました。', '民[衆|しゅう]の声を聞きました。'] },
    補: { readings: ['おぎな', 'ほ'], patterns: ['不足を[補|おぎな]いました。', '[補|ほ]習を受けました。'] },
  },
  6: {
    呼: { readings: ['よ', 'こ'], patterns: ['名前を[呼|よ]びました。', '[呼|こ]吸をしました。'] },
    宝: { readings: ['たから', 'ほう'], patterns: ['[宝|たから]物を見つけました。', '[宝|ほう]石を集めました。'] },
    座: { readings: ['すわ', 'ざ'], patterns: ['椅子に[座|すわ]りました。', '星[座|ざ]を見ました。'] },
    捨: { readings: ['す', 'しゃ'], patterns: ['ゴミを[捨|す]てました。', '取[捨|しゃ]選択しました。'] },
    揮: { readings: ['き'], patterns: ['指[揮|き]を執りました。', '発[揮|き]しました。'] },
  },
}

// 問題文を生成
function generateSentence(kanji: string, grade: number): string {
  const patterns = kanjiPatterns[grade]?.[kanji]
  if (!patterns) {
    // デフォルトパターン
    return `[${kanji}|よみ]を学びました。`
  }

  const randomIndex = Math.floor(Math.random() * patterns.patterns.length)
  return patterns.patterns[randomIndex]
}

// 各学年の問題を更新
function updateGradeQuestions(grade: number) {
  const filePath = `/home/unok/git/daily-kanji/daily-kanji/src/data/questions/questions-elementary${grade}.json`
  const data: QuestionsData = JSON.parse(readFileSync(filePath, 'utf8'))
  const underrepresented = findUnderrepresentedKanji(grade)

  if (underrepresented.length === 0) {
    console.log(`小学${grade}年生: 追加する漢字はありません`)
    return
  }

  console.log(`小学${grade}年生: ${underrepresented.length}個の漢字を追加`)

  let questionId = data.questions.length + 1
  const additionalQuestions: Question[] = []

  for (const { kanji, needed } of underrepresented) {
    for (let i = 0; i < needed; i++) {
      additionalQuestions.push({
        id: `e${grade}-${questionId}`,
        sentence: generateSentence(kanji, grade),
      })
      questionId++
    }
  }

  data.questions = [...data.questions, ...additionalQuestions]
  writeFileSync(filePath, JSON.stringify(data, null, 2))
  console.log(`  → ${additionalQuestions.length}問追加しました`)
}

// メイン処理
function main() {
  console.log('5回未満の漢字に問題を追加します...')

  for (let grade = 1; grade <= 6; grade++) {
    updateGradeQuestions(grade)
  }

  console.log('完了しました！')
}

main()
