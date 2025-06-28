#!/usr/bin/env tsx

import * as fs from 'node:fs'
import * as path from 'node:path'

// 5年生の漢字リスト（代表的なもの）
const _grade5RepresentativeKanji = [
  '圧',
  '移',
  '因',
  '永',
  '営',
  '衛',
  '易',
  '益',
  '液',
  '演',
  '応',
  '往',
  '桜',
  '恩',
  '可',
  '仮',
  '価',
  '河',
  '過',
  '賀',
  '快',
  '解',
  '格',
  '確',
  '額',
  '刊',
  '幹',
  '慣',
  '眼',
  '基',
  '寄',
  '規',
  '技',
  '義',
  '逆',
  '久',
  '旧',
  '居',
  '許',
  '境',
  '均',
  '禁',
  '句',
  '群',
  '経',
  '潔',
  '件',
  '券',
  '険',
  '検',
  '限',
  '現',
  '減',
  '故',
  '個',
  '護',
  '効',
  '厚',
  '耕',
  '鉱',
  '構',
  '興',
  '講',
  '混',
  '査',
  '再',
  '災',
  '妻',
  '採',
  '際',
  '在',
  '財',
  '罪',
  '雑',
  '酸',
  '賛',
  '支',
  '志',
  '枝',
  '師',
  '資',
  '飼',
  '示',
  '似',
  '識',
  '質',
  '舎',
  '謝',
  '授',
  '修',
  '述',
  '術',
  '準',
  '序',
  '招',
  '承',
  '証',
  '条',
  '状',
  '常',
  '情',
  '織',
  '職',
  '制',
  '性',
  '政',
  '勢',
  '精',
  '製',
  '税',
  '責',
  '績',
  '接',
  '設',
  '舌',
  '絶',
  '銭',
  '祖',
  '素',
  '総',
  '造',
  '像',
  '増',
  '則',
  '測',
  '属',
  '率',
  '損',
  '退',
  '貸',
  '態',
  '団',
  '断',
  '築',
  '張',
  '提',
  '程',
  '適',
  '敵',
  '統',
  '銅',
  '導',
  '徳',
  '独',
  '任',
  '燃',
  '能',
  '破',
  '犯',
  '判',
  '版',
  '比',
  '肥',
  '非',
  '備',
  '俵',
  '評',
  '貧',
  '布',
  '婦',
  '富',
  '武',
  '復',
  '複',
  '仏',
  '編',
  '弁',
  '保',
  '墓',
  '報',
  '豊',
  '防',
  '貿',
  '暴',
  '務',
  '夢',
  '迷',
  '綿',
  '輸',
  '余',
  '預',
  '容',
  '略',
  '留',
  '領',
]

// 修正マッピング（問題IDごとに適切な5年生の漢字を定義）
const corrections: Record<string, string> = {
  // part1
  'e5-043': '[財|ざい]産を築きました。',
  'e5-056': '[志|こころざし]を高く持ちます。',
  'e5-129': '[団|だん]体で行動します。',
  'e5-138': '[複|ふく]数の人が集まりました。',
  'e5-143': '[増|ま]し算をしました。',
  'e5-145': '[検|けん]査を受けました。',

  // part2
  'e5-160': '[貿|ぼう]易をします。',
  'e5-163': '[祝|いわ]いの言葉を贈りました。',
  'e5-164': '[貸|か]し出しをお願いします。',
  'e5-167': '[速|そく]達で送りました。',
  'e5-180': '[防|ぼう]護柵を設置しました。',
  'e5-182': '[険|けん]しい道を歩きました。',
  'e5-184': '[防|ぼう]止策を立てました。',
  'e5-216': '[団|だん]体戦で勝ちました。',
  'e5-225': '[複|ふく]数の意見がありました。',
  'e5-230': '[支|し]援をお願いします。',
  'e5-232': '[検|けん]査しました。',
  'e5-244': '[貿|ぼう]易商になりました。',
  'e5-247': '[祝|いわ]い事がありました。',
  'e5-248': '[貸|か]し借りの約束をしました。',
  'e5-251': '[急|きゅう]行列車に乗りました。',
  'e5-264': '[防|ぼう]護服を着ました。',
  'e5-266': '[険|けん]悪な表情をしました。',
  'e5-300': '[団|だん]結して頑張りました。',
  'e5-304': '[検|けん]査を実施しました。',
  'e5-309': '[複|ふく]雑な問題でした。',

  // part3
  'e5-314': '[増|ぞう]加しました。',
  'e5-316': '[検|けん]討しました。',
  'e5-328': '[貿|ぼう]易港に行きました。',
  'e5-331': '[祝|しゅく]日でした。',
  'e5-332': '[借|か]りました。',
  'e5-335': '[急|きゅう]速に発展しました。',
  'e5-348': '[防|ぼう]止しました。',
  'e5-350': '[険|けん]悪でした。',
  'e5-384': '[団|だん]地に住んでいます。',
  'e5-393': '[複|ふく]写しました。',
  'e5-398': '[支|し]持しました。',
  'e5-400': '[検|けん]証しました。',

  // part5
  'e5-634': '[祝|しゅく]賀会を開きました。',
  'e5-635': '[祝|しゅく]福を受けました。',
  'e5-719': '[往|おう]復しました。',

  // part6
  'e5-808': '[移|い]転しました。',
  'e5-841': '[豊|ゆた]かな生活をしています。',
  'e5-842': '[豊|ほう]富な経験があります。',
  'e5-843': '[豊|ほう]作でした。',
  'e5-844': '[豊|ゆた]かな心を持ちましょう。',
  'e5-893': '[徳|とく]を積みました。',
  'e5-894': '[徳|とく]の高い人です。',
  'e5-895': '[徳|とく]を重んじます。',
  'e5-896': '[徳|とく]のある行いをしました。',
  'e5-911': '[賛|さん]成しました。',

  // part7
  'e5-979': '[仲|なか]間と遊びました。',
  'e5-996': '[枝|えだ]が揺れています。',
  'e5-1008': '[検|けん]査を受けました。',
  'e5-1095': '[団|だん]結力が強いです。',

  // part8
  'e5-1215': '[豊|ゆた]かな才能があります。',
  'e5-1216': '[豊|ほう]満な体型です。',
  'e5-1266': '[祝|しゅく]典に参加しました。',
  'e5-1267': '[規|き]則正しい生活をしています。',

  // part9
  'e5-1280': '[確|かく]実に進めます。',
  'e5-1281': '[確|かく]かな手応えがありました。',
  'e5-1283': '[確|かく]定しました。',
  'e5-1284': '[確|かく]認しました。',
}

// メイン処理
console.log('🔧 小学5年生の学習対象漢字修正スクリプト')
console.log('================================================================================')

const questionsDir = path.join(process.cwd(), 'src/data/questions')
const fileUpdates = new Map<string, number>()

// 修正をファイルごとにグループ化
const correctionsByFile = new Map<string, Array<{ id: string; sentence: string }>>()

for (const [id, sentence] of Object.entries(corrections)) {
  // IDからファイル名を推測
  const partMatch = id.match(/e5-(\d+)/)
  if (!partMatch) continue

  const num = Number.parseInt(partMatch[1])
  let partNum: number

  if (num <= 150) partNum = 1
  else if (num <= 310) partNum = 2
  else if (num <= 470) partNum = 3
  else if (num <= 630) partNum = 4
  else if (num <= 790) partNum = 5
  else if (num <= 950) partNum = 6
  else if (num <= 1110) partNum = 7
  else if (num <= 1270) partNum = 8
  else partNum = 9

  const fileName = `questions-elementary5-part${partNum}.json`

  if (!correctionsByFile.has(fileName)) {
    correctionsByFile.set(fileName, [])
  }
  correctionsByFile.get(fileName)?.push({ id, sentence })
}

// 各ファイルを処理
for (const [fileName, fileCorrections] of correctionsByFile) {
  const filePath = path.join(questionsDir, fileName)

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${fileName} が見つかりません`)
    continue
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let updateCount = 0

  // 各問題を修正
  for (const question of data.questions) {
    const correction = fileCorrections.find((c) => c.id === question.id)
    if (correction) {
      question.sentence = correction.sentence
      updateCount++
    }
  }

  if (updateCount > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
    fileUpdates.set(fileName, updateCount)
  }
}

console.log('\n📊 修正結果:')
let totalUpdates = 0
for (const [file, count] of fileUpdates) {
  console.log(`  ${file}: ${count}件修正`)
  totalUpdates += count
}

console.log(`\n✅ 合計 ${totalUpdates} 件の問題を修正しました。`)
