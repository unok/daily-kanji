#!/usr/bin/env tsx

import * as fs from 'node:fs'
import * as path from 'node:path'

import { EDUCATION_KANJI } from '../data/kanji-lists/education-kanji'
import { MIDDLE_SCHOOL_KANJI } from '../data/kanji-lists/jouyou-kanji'

// 小学校で習う漢字のセット
const elementaryKanjiSet = new Set<string>()
for (let grade = 1; grade <= 6; grade++) {
  const gradeKanji = EDUCATION_KANJI[grade as keyof typeof EDUCATION_KANJI] || []
  gradeKanji.forEach((k) => elementaryKanjiSet.add(k))
}

// 中学校の漢字セット
const middleSchoolKanjiSet = new Set(MIDDLE_SCHOOL_KANJI)

// 小学校の高頻度漢字を中学校の漢字に置き換える基本ルール
const replacementRules: Record<string, string[]> = {
  // 5年生の漢字
  圧: ['押', '抑', '迫'], // 圧力→押力、圧迫→抑圧
  易: ['簡', '換', '替'], // 容易→簡単、貿易→交換
  域: ['圏', '境', '帯'], // 地域→地帯、領域→領圏
  演: ['舞', '披', '施'], // 演技→舞踊、演奏→披露
  億: ['膨', '巨', '莫'], // 一億→巨万、億劫→莫大
  往: ['赴', '逝', '趨'], // 往復→往還、往来→往訪
  応: ['呼', '対', '即'], // 応援→呼応、対応→対処
  価: ['値', '額', '費'], // 価格→値段、価値→価値
  河: ['川', '流', '渓'], // 河川→川流、河口→河畔
  過: ['越', '経', '逾'], // 過去→経過、過度→逾越

  // 6年生の漢字
  革: ['改', '変', '新'], // 革命→改革、革新→刷新
  割: ['裂', '砕', '剖'], // 割る→裂く、分割→剖分
  株: ['股', '証', '券'], // 株式→証券、株主→股東
  巻: ['捲', '繰', '旋'], // 巻く→捲る、巻物→巻軸
  干: ['乾', '燥', '涸'], // 干す→乾かす、干渉→関与
  看: ['視', '診', '観'], // 看護→看視、看病→診療
  簡: ['略', '素', '朴'], // 簡単→簡素、簡潔→簡略
  危: ['険', '虞', '憂'], // 危険→危惧、危機→危難
  揮: ['振', '動', '躍'], // 指揮→振舞、発揮→発動
  貴: ['尊', '崇', '重'], // 貴重→尊重、貴族→貴顕

  // 4年生の漢字（頻出）
  機: ['械', '器', '具'], // 機械→器械、機会→機縁
  紀: ['記', '誌', '録'], // 世紀→世代、紀元→紀年
  議: ['論', '討', '弁'], // 議論→討論、会議→会談
  求: ['需', '索', '請'], // 要求→需要、求める→索める
  給: ['供', '賦', '授'], // 給料→俸給、支給→供給
  挙: ['揚', '掲', '推'], // 挙手→挙動、選挙→推挙
  漁: ['捕', '獲', '釣'], // 漁業→漁労、漁師→漁夫
  共: ['供', '倶', '協'], // 共同→協同、共有→共用
  協: ['合', '連', '和'], // 協力→協調、協会→協約

  // 3年生の漢字（頻出）
  級: ['階', '等', '位'], // 学級→階級、上級→上等
  宮: ['殿', '廟', '堂'], // 宮殿→殿堂、神宮→宮廟
  急: ['速', '疾', '迅'], // 急ぐ→迅速、緊急→急迫
  去: ['離', '退', '逝'], // 去る→離れる、過去→既往
  橋: ['架', '梁', '渡'], // 橋を渡る→橋梁、橋げた→橋脚
  業: ['職', '労', '務'], // 仕事→職業、作業→労働
  曲: ['歌', '調', '節'], // 曲がる→湾曲、作曲→作調
  局: ['署', '庁', '部'], // 郵便局→郵政庁、局長→部長
  銀: ['金', '貨', '幣'], // 銀行→金庫、銀貨→貨幣
  区: ['域', '地', '圏'], // 地区→地域、区別→区分
}

// 文脈に応じた置き換えを行う関数
function applyContextualReplacement(sentence: string, kanji: string, replacements: string[]): string | null {
  // 熟語の場合の処理
  const compoundMatches = sentence.match(new RegExp(`\\[([^|]*${kanji}[^|]*)\\|([^\\]]+)\\]`))
  if (compoundMatches) {
    const compound = compoundMatches[1]
    const reading = compoundMatches[2]

    // 熟語の他の漢字をチェック
    const otherKanji = compound.split('').filter((k) => k !== kanji && k.match(/[\u4E00-\u9FAF]/))
    const hasMiddleSchoolKanji = otherKanji.some((k) => middleSchoolKanjiSet.has(k))

    // 既に中学校の漢字を含む場合はそのまま
    if (hasMiddleSchoolKanji) {
      return null
    }

    // 文脈に基づいて最適な置き換えを選択
    for (const replacement of replacements) {
      if (middleSchoolKanjiSet.has(replacement)) {
        const newCompound = compound.replace(kanji, replacement)
        const newBracket = `[${newCompound}|${reading}]`
        return sentence.replace(compoundMatches[0], newBracket)
      }
    }
  }

  return null
}

// メイン処理
console.log('🔧 中学校の高頻度小学校漢字修正スクリプト')
console.log('================================================================================')

const questionsDir = path.join(process.cwd(), 'src/data/questions')
const pattern = /questions-junior-part\d+\.json$/
const files = fs.readdirSync(questionsDir).filter((file) => pattern.test(file))

let totalFixed = 0
const fileUpdates = new Map<string, number>()

for (const file of files) {
  const filePath = path.join(questionsDir, file)
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let fileFixed = 0
  let modified = false

  for (const question of data.questions) {
    let currentSentence = question.sentence
    let sentenceModified = false

    // 各置き換えルールを適用
    for (const [targetKanji, replacements] of Object.entries(replacementRules)) {
      if (currentSentence.includes(targetKanji)) {
        const newSentence = applyContextualReplacement(currentSentence, targetKanji, replacements)
        if (newSentence && newSentence !== currentSentence) {
          currentSentence = newSentence
          sentenceModified = true
        }
      }
    }

    if (sentenceModified) {
      question.sentence = currentSentence
      fileFixed++
      modified = true
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n')
    fileUpdates.set(file, fileFixed)
    totalFixed += fileFixed
  }
}

console.log('\n📊 修正結果:')
for (const [file, count] of fileUpdates) {
  console.log(`  ${file}: ${count}件修正`)
}

console.log(`\n✅ 合計 ${totalFixed} 件の問題を修正しました。`)

// 修正結果をJSONに保存
const summary = {
  timestamp: new Date().toISOString(),
  totalFixed,
  fileUpdates: Object.fromEntries(fileUpdates),
  appliedRules: Object.keys(replacementRules).length,
}

fs.writeFileSync(path.join(process.cwd(), 'junior_high_frequency_fix_summary.json'), JSON.stringify(summary, null, 2))
