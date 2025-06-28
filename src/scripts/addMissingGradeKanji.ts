#!/usr/bin/env tsx

import * as fs from 'node:fs'
import * as path from 'node:path'

const questionsDir = path.join(process.cwd(), 'src/data/questions')

interface Question {
  id: string
  sentence: string
}

interface QuestionsFile {
  questions: Question[]
}

// 小学4年生で不足している漢字（主に都道府県名）
const missingGrade4Kanji = [
  { kanji: '井', reading: 'い', sentence: '天[井|てんじょう]を見上げました。' },
  { kanji: '佐', reading: 'さ', sentence: '[佐|さ]賀県に旅行しました。' },
  { kanji: '埼', reading: 'さい', sentence: '[埼|さい]玉県の特産品を買いました。' },
  { kanji: '奈', reading: 'な', sentence: '[奈|な]良県の大仏を見学しました。' },
  { kanji: '媛', reading: 'えん', sentence: '愛[媛|ひめ]県のみかんを食べました。' },
  { kanji: '富', reading: 'ふ', sentence: '[富|ふ]士山に登りました。' },
  { kanji: '岐', reading: 'ぎ', sentence: '[岐|ぎ]阜県の白川郷を訪れました。' },
  { kanji: '岡', reading: 'おか', sentence: '静[岡|おか]県でお茶を飲みました。' },
  { kanji: '崎', reading: 'さき', sentence: '長[崎|さき]県の夜景を見ました。' },
  { kanji: '徳', reading: 'とく', sentence: '[徳|とく]島県の阿波踊りを見ました。' },
  { kanji: '栃', reading: 'とち', sentence: '[栃|とち]木県の日光を訪れました。' },
  { kanji: '梨', reading: 'なし', sentence: '山[梨|なし]県のぶどうを食べました。' },
  { kanji: '沖', reading: 'おき', sentence: '[沖|おき]縄県の海で泳ぎました。' },
  { kanji: '滋', reading: 'じ', sentence: '[滋|し]賀県の琵琶湖を見ました。' },
  { kanji: '潟', reading: 'がた', sentence: '新[潟|がた]県の米を食べました。' },
  { kanji: '熊', reading: 'くま', sentence: '[熊|くま]本県の阿蘇山を見ました。' },
  { kanji: '縄', reading: 'なわ', sentence: '沖[縄|なわ]県の文化を学びました。' },
  { kanji: '群', reading: 'ぐん', sentence: '[群|ぐん]馬県の温泉に入りました。' },
  { kanji: '茨', reading: 'いばら', sentence: '[茨|いばら]城県の納豆を食べました。' },
  { kanji: '賀', reading: 'が', sentence: '佐[賀|が]県の有田焼を見ました。' },
  { kanji: '阜', reading: 'ふ', sentence: '岐[阜|ふ]県の合掌造りを見学しました。' },
  { kanji: '阪', reading: 'さか', sentence: '大[阪|さか]府のたこ焼きを食べました。' },
  { kanji: '香', reading: 'か', sentence: '[香|か]川県のうどんを食べました。' },
  { kanji: '鹿', reading: 'か', sentence: '[鹿|か]児島県の桜島を見ました。' },
]

// 小学5年生で不足している漢字
const missingGrade5Kanji = [
  { kanji: '史', reading: 'し', sentence: '日本の歴[史|し]を勉強しました。' },
  { kanji: '告', reading: 'こく', sentence: '重要な[告|こく]知を受けました。' },
  { kanji: '喜', reading: 'き', sentence: '合格を[喜|よろこ]びました。' },
  { kanji: '囲', reading: 'い', sentence: '敵に[囲|かこ]まれました。' },
  { kanji: '型', reading: 'かた', sentence: '新しい[型|かた]の車を買いました。' },
  { kanji: '士', reading: 'し', sentence: '弁護[士|し]に相談しました。' },
  { kanji: '救', reading: 'きゅう', sentence: '人命[救|きゅう]助を行いました。' },
  { kanji: '殺', reading: 'さつ', sentence: '[殺|さっ]菌消毒をしました。' },
  { kanji: '紀', reading: 'き', sentence: '二十一世[紀|き]に生きています。' },
  { kanji: '航', reading: 'こう', sentence: '飛行機で[航|こう]海しました。' },
  { kanji: '象', reading: 'ぞう', sentence: '動物園で[象|ぞう]を見ました。' },
  { kanji: '賞', reading: 'しょう', sentence: '優秀[賞|しょう]をもらいました。' },
]

// 小学6年生で不足している漢字
const missingGrade6Kanji = [
  { kanji: '停', reading: 'てい', sentence: 'バス[停|てい]で待ちました。' },
  { kanji: '堂', reading: 'どう', sentence: '食[堂|どう]で昼食を食べました。' },
  { kanji: '得', reading: 'とく', sentence: '[得|とく]意な科目があります。' },
  { kanji: '毒', reading: 'どく', sentence: '有[毒|どく]物質に注意しました。' },
  { kanji: '胃', reading: 'い', sentence: '[胃|い]が痛くなりました。' },
  { kanji: '脈', reading: 'みゃく', sentence: '[脈|みゃく]拍を測りました。' },
  { kanji: '腸', reading: 'ちょう', sentence: '[腸|ちょう]の調子が悪いです。' },
]

function addQuestionsToFile(grade: string, newQuestions: Array<{ kanji: string; reading: string; sentence: string }>) {
  const pattern = new RegExp(`questions-${grade}-part\\d+\\.json$`)
  const files = fs
    .readdirSync(questionsDir)
    .filter((file) => pattern.test(file))
    .sort()

  if (files.length === 0) {
    console.error(`No files found for grade ${grade}`)
    return
  }

  // 最後のパートファイルに追加
  const lastFile = files[files.length - 1]
  const filePath = path.join(questionsDir, lastFile)
  const data: QuestionsFile = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  // 既存の最大IDを取得
  let maxId = 0
  for (const q of data.questions) {
    const match = q.id.match(/(\d+)$/)
    if (match) {
      const num = Number.parseInt(match[1])
      if (num > maxId) maxId = num
    }
  }

  // 新しい問題を追加
  for (const newQ of newQuestions) {
    maxId++
    const prefix = grade.replace('elementary', 'e')
    data.questions.push({
      id: `${prefix}-${maxId}`,
      sentence: newQ.sentence,
    })
  }

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
}
addQuestionsToFile('elementary4', missingGrade4Kanji)
addQuestionsToFile('elementary5', missingGrade5Kanji)
addQuestionsToFile('elementary6', missingGrade6Kanji)
