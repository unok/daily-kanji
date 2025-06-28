#!/usr/bin/env tsx

import * as fs from 'node:fs'
import * as path from 'node:path'

// 残りの修正（祝→4年、速→3年、急→3年、借→4年、徳→4年を5年生の漢字に）
const corrections: Record<string, string> = {
  // 祝(4年) → 祖(5年)に変更
  'e5-163': '[祖|そ]先を大切にしました。',
  'e5-247': '[祖|そ]国を愛しています。',
  'e5-331': '[祖|そ]父母の家に行きました。',
  'e5-634': '[祖|そ]先の霊を慰めました。',
  'e5-635': '[祖|そ]父の話を聞きました。',

  // 速(3年) → 迅速の迅は中学なので、素(5年)に
  'e5-167': '[素|そ]早く行動しました。',

  // 急(3年) → 快(5年)に
  'e5-251': '[快|かい]速電車に乗りました。',
  'e5-335': '[快|かい]進撃を続けました。',

  // 借(4年) → 貸(5年)に
  'e5-332': '[貸|か]してもらいました。',

  // 徳(4年) → 得(4年)ではなく態(5年)に
  'e5-893': '[態|たい]度を改めました。',
  'e5-894': '[態|たい]勢を整えました。',
  'e5-895': '[態|たい]度が良いです。',
  'e5-896': '[態|たい]度を正しました。',
  'e5-1266': '[態|たい]度を示しました。',
  'e5-1267': '[則|そく]に従いました。',
}

const questionsDir = path.join(process.cwd(), 'src/data/questions')
const fileUpdates = new Map<string, number>()

// 修正をファイルごとにグループ化
const correctionsByFile = new Map<string, Array<{ id: string; sentence: string }>>()

for (const [id, sentence] of Object.entries(corrections)) {
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

  if (!fs.existsSync(filePath)) continue

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let updateCount = 0

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

console.log('🔧 小学5年生の残り修正')
console.log('================================================================================')
console.log('\n📊 修正結果:')
let totalUpdates = 0
for (const [file, count] of fileUpdates) {
  console.log(`  ${file}: ${count}件修正`)
  totalUpdates += count
}
console.log(`\n✅ 合計 ${totalUpdates} 件の問題を修正しました。`)
