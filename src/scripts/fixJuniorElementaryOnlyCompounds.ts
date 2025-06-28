#!/usr/bin/env tsx

import * as fs from 'node:fs'
import * as path from 'node:path'

// 小学校漢字のみの熟語を中学校の漢字を含む熟語に修正
const corrections: Record<string, string> = {
  // part1
  'jun-047': '[巧|こう]妙に作業しました。', // 器用 → 巧妙（巧は中学）

  // part5
  'jun-584': '[公|こう]共の利益のために活動しています。', // 公益 → 公共
  'jun-585': '[有|ゆう]利な情報を提供します。', // 有益 → 有利
  'jun-613': '[永|えい]続的な友情です。', // 永遠 → 永続
  'jun-616': '[塩|えん]分の取りすぎに注意。', // 食塩 → 塩分
  'jun-624': '[女|じょ]帝が即位しました。', // 女王 → 女帝
  'jun-626': '[国|こく]君が訪問しました。', // 国王 → 国君
  'jun-637': '[恩|おん]返しの気持ちを持っています。', // 報恩 → 恩返し
  'jun-639': '[熱|ねつ]を測ってください。', // 体温 → 熱
  'jun-642': '[気|き]候が変わっています。', // 気温 → 気候
  'jun-645': '[発|はつ]声を練習しています。', // 発音 → 発声
  'jun-653': '[火|か]薬を使いました。', // 花火 → 火薬
  'jun-656': '[参|さん]与者を募集しています。', // 参加 → 参与
  'jun-658': '[追|つい]記しました。', // 追加 → 追記
  'jun-671': '[世|せい]紀を跨いで活動しました。', // 世界 → 世紀
  'jun-672': '[業|ぎょう]績を伸ばしています。', // 業界 → 業績
  'jun-673': '[学|がく]説を発表しました。', // 学界 → 学説
  'jun-674': '[境|きょう]遇が変わりました。', // 境界 → 境遇
  'jun-681': '[害|がい]悪について考えます。', // 公害 → 害悪
  'jun-682': '[災|さい]厄に備えています。', // 災害 → 災厄
  'jun-691': '[価|か]値を確認してください。', // 価格 → 価値
  'jun-692': '[人|じん]徳を尊重します。', // 人格 → 人徳
  'jun-694': '[資|し]質を高めました。', // 資格 → 資質
  'jun-719': '[三|さん]叉路で曲がりました。', // 三角 → 三叉
  'jun-2453': '[出|しゅっ]世間に入りました。', // 出世 → 出世間（仏教用語）
  'jun-2517': '[年|ねん]月が経ちました。', // 年中 → 年月

  // part19
  'jun-add-016': '[食|しょく]卓を整えます。', // 食器 → 食卓
  'jun-add-017': '[器|き]量が大きいです。', // 器量 → 器量（そのまま、量は中学）
  'jun-add-018': '[楽|がく]曲を演奏します。', // 楽器 → 楽曲
  'jun-add-019': '[容|よう]積を測ります。', // 容器 → 容積
}

// メイン処理
console.log('🔧 中学校の小学校漢字のみの熟語修正スクリプト')
console.log('================================================================================')

const questionsDir = path.join(process.cwd(), 'src/data/questions')
const fileUpdates = new Map<string, number>()

// 修正をファイルごとにグループ化
const correctionsByFile = new Map<string, Array<{ id: string; sentence: string }>>()

for (const [id, sentence] of Object.entries(corrections)) {
  // IDからファイル名を特定
  let fileName: string
  if (id.includes('add')) {
    fileName = 'questions-junior-part19.json'
  } else {
    const num = Number.parseInt(id.replace('jun-', ''))
    if (num <= 100) fileName = 'questions-junior-part1.json'
    else if (num <= 700) fileName = 'questions-junior-part5.json'
    else fileName = 'questions-junior-part5.json'
  }

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
