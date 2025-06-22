#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'node:fs'

import { getKanjiByGrade } from '../data/kanji-lists/education-kanji'
import { parseQuestion } from '../utils/questionParser'
import { grade3Patterns } from './grade3Patterns'

// 学年別の漢字パターン定義
const kanjiPatterns: Record<string, { readings: string[]; patterns: string[] }> = {
  // 小学2年生の基本漢字
  線: { readings: ['せん'], patterns: ['[線|せん]を引きました。', '電[線|せん]があります。', '白い[線|せん]です。'] },
  話: { readings: ['はなし', 'わ'], patterns: ['[話|はなし]を聞きました。', '[話|わ]しかけました。', '会[話|わ]しました。'] },
  声: { readings: ['こえ'], patterns: ['大きな[声|こえ]です。', '[声|こえ]をかけました。', '[声|こえ]が聞こえました。'] },
  聞: { readings: ['き'], patterns: ['音楽を[聞|き]きました。', '[聞|き]こえました。', '先生の話を[聞|き]きました。'] },
  読: { readings: ['よ'], patterns: ['本を[読|よ]みました。', '新聞を[読|よ]みました。', '[読|よ]み書きできます。'] },
  書: { readings: ['か'], patterns: ['手紙を[書|か]きました。', '名前を[書|か]きました。', '[書|か]き物をしました。'] },
  引: { readings: ['ひ'], patterns: ['[引|ひ]っ張りました。', '[引|ひ]き出しを開けました。', '線を[引|ひ]きました。'] },
  地: { readings: ['ち'], patterns: ['[地|ち]面に座りました。', '[地|ち]図を見ました。', '土[地|ち]があります。'] },
  谷: { readings: ['たに'], patterns: ['深い[谷|たに]です。', '[谷|たに]川が流れています。', '[谷|たに]間を歩きました。'] },
  紙: { readings: ['かみ'], patterns: ['白い[紙|かみ]です。', '[紙|かみ]に絵を描きました。', '折り[紙|かみ]をしました。'] },
  色: { readings: ['いろ'], patterns: ['赤い[色|いろ]です。', '[色|いろ]を塗りました。', 'きれいな[色|いろ]です。'] },
  来: { readings: ['き', 'く'], patterns: ['学校に[来|き]ました。', '友達が[来|く]るかもしれません。', '明日[来|き]てください。'] },
  行: { readings: ['い', 'ゆ'], patterns: ['学校に[行|い]きました。', '旅[行|こう]しました。', '[行|ゆ]き先を決めました。'] },
  走: { readings: ['はし'], patterns: ['速く[走|はし]りました。', '[走|はし]って行きました。', '一緒に[走|はし]りました。'] },
  止: { readings: ['と'], patterns: ['[止|と]まりました。', '[止|と]めました。', '雨が[止|や]みました。'] },
  歌: { readings: ['うた'], patterns: ['[歌|うた]を歌いました。', '好きな[歌|うた]です。', '[歌|うた]声が聞こえました。'] },
  弱: { readings: ['よわ'], patterns: ['[弱|よわ]い風です。', '[弱|よわ]虫です。', '[弱|よわ]っています。'] },
  強: { readings: ['つよ'], patterns: ['[強|つよ]い風です。', '[強|つよ]くなりました。', '[強|つよ]く押しました。'] },
  時: { readings: ['とき', 'じ'], patterns: ['楽しい[時|とき]です。', '三[時|じ]に帰ります。', '[時|とき]々雨が降ります。'] },
  朝: { readings: ['あさ'], patterns: ['[朝|あさ]早く起きました。', '[朝|あさ]ご飯を食べました。', 'きれいな[朝|あさ]です。'] },
  分: { readings: ['わ', 'ふん'], patterns: ['半分に[分|わ]けました。', '十五[分|ふん]かかります。', '[分|わ]からないことがあります。'] },
  秋: { readings: ['あき'], patterns: ['[秋|あき]の季節です。', '[秋|あき]になりました。', '[秋|あき]の葉っぱです。'] },
  間: { readings: ['あいだ', 'ま'], patterns: ['木と木の[間|あいだ]です。', '時[間|かん]があります。', '[間|ま]に合いました。'] },
  遠: { readings: ['とお'], patterns: ['[遠|とお]い場所です。', '[遠|とお]くから来ました。', '[遠|とお]く見えます。'] },
  前: { readings: ['まえ'], patterns: ['学校の[前|まえ]です。', '[前|まえ]に進みました。', '以[前|まえ]から知っています。'] },
  風: { readings: ['かぜ'], patterns: ['涼しい[風|かぜ]です。', '[風|かぜ]が吹いています。', '強い[風|かぜ]です。'] },
  星: { readings: ['ほし'], patterns: ['きれいな[星|ほし]です。', '[星|ほし]を見ました。', '[星|ほし]座を探しました。'] },
  帰: { readings: ['かえ'], patterns: ['家に[帰|かえ]りました。', '[帰|かえ]り道です。', '早く[帰|かえ]りたいです。'] },
  歩: { readings: ['ある', 'ほ'], patterns: ['ゆっくり[歩|ある]きました。', '[歩|ほ]道を歩きました。', '散[歩|ぽ]しました。'] },
  買: { readings: ['か'], patterns: ['本を[買|か]いました。', '[買|か]い物に行きました。', 'お菓子を[買|か]いました。'] },
}

// 特定学年の不足漢字を取得
function getUnderrepresentedKanji(grade: number): { kanji: string; count: number; needed: number }[] {
  const filePath = `/home/unok/git/daily-kanji/daily-kanji/src/data/questions/questions-elementary${grade}.json`
  const data = JSON.parse(readFileSync(filePath, 'utf8'))
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

  const targetKanji = getKanjiByGrade(grade)
  const underrepresented: { kanji: string; count: number; needed: number }[] = []

  for (const kanji of targetKanji) {
    const count = kanjiCount.get(kanji) || 0
    if (count < 5) {
      underrepresented.push({ kanji, count, needed: 5 - count })
    }
  }

  return underrepresented.sort((a, b) => a.count - b.count)
}

// 問題文を生成
function generateSentence(kanji: string, grade: number): string {
  let pattern = kanjiPatterns[kanji]

  // 学年別のパターンをチェック
  if (!pattern && grade === 3) {
    pattern = grade3Patterns[kanji]
  }

  if (!pattern) {
    return `[${kanji}|よみ]を学びました。`
  }

  const randomIndex = Math.floor(Math.random() * pattern.patterns.length)
  return pattern.patterns[randomIndex]
}

// 学年の問題を更新
function addQuestionsForGrade(grade: number) {
  const filePath = `/home/unok/git/daily-kanji/daily-kanji/src/data/questions/questions-elementary${grade}.json`
  const data = JSON.parse(readFileSync(filePath, 'utf8'))
  const underrepresented = getUnderrepresentedKanji(grade)

  if (underrepresented.length === 0) {
    console.log(`小学${grade}年生: 追加する漢字はありません`)
    return
  }

  console.log(`小学${grade}年生: ${underrepresented.length}個の漢字に問題を追加`)

  let questionId = data.questions.length + 1
  const additionalQuestions: { id: string; sentence: string }[] = []

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

// 指定された学年の問題を追加
const grade = Number.parseInt(process.argv[2]) || 2
addQuestionsForGrade(grade)
