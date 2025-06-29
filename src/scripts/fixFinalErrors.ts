#!/usr/bin/env tsx

import * as fs from 'node:fs'
import * as path from 'node:path'

// エラーの修正データ
const fixes = {
  // 重複漢字エラーの修正
  kanjiDuplication: {
    'j-50394': '[劾|がい]議する声が上がりました。', // 劾劾 → 劾議
    'j-50510': '[叙|じょ]位の栄に浴しました。', // 叙勲を削除
  },

  // 重複文章の修正（2つ目のIDを変更）
  sentenceDuplication: {
    'e3-1239': '[安|あん]全に配慮しました。',
    'e5-1295': '公園で[象|ぞう]の像を見ました。',
    'e6-1319': '食[堂|どう]で夕食を食べました。',
    'j-60009': '[炎|えん]上していました。',
    'jun-603': '海岸に[沿|そ]って歩きました。',
    'j-60012': 'ナッツの[殻|から]を割りました。',
  },
}

// メイン処理
const main = () => {
  console.log('最終エラーの修正を開始します...')

  const questionsDir = path.join(process.cwd(), 'src/data/questions')
  const files = fs.readdirSync(questionsDir).filter((f) => f.endsWith('.json'))

  let totalFixed = 0

  for (const file of files) {
    const filePath = path.join(questionsDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(content)

    let modified = false

    for (const question of data.questions) {
      // 漢字重複エラーの修正
      if (fixes.kanjiDuplication[question.id]) {
        console.log(`修正: ${question.id} (漢字重複)`)
        question.sentence = fixes.kanjiDuplication[question.id]
        modified = true
        totalFixed++
      }

      // 文章重複エラーの修正
      if (fixes.sentenceDuplication[question.id]) {
        console.log(`修正: ${question.id} (文章重複)`)
        question.sentence = fixes.sentenceDuplication[question.id]
        modified = true
        totalFixed++
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
      console.log(`✅ ${file} を更新しました`)
    }
  }

  console.log(`\n✅ 合計 ${totalFixed} 件のエラーを修正しました。`)
}

// 実行
main()
