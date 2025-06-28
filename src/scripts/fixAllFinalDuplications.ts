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

// IDを見つけるためのヘルパー関数
function findProblemIdBySentence(grade: string, sentence: string): string | null {
  const pattern = new RegExp(`questions-${grade}-part\\d+\\.json$`)
  const files = fs
    .readdirSync(questionsDir)
    .filter((file) => pattern.test(file))
    .sort()

  for (const file of files) {
    const filePath = path.join(questionsDir, file)
    const data: QuestionsFile = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    for (const question of data.questions) {
      if (question.sentence.includes(sentence)) {
        return question.id
      }
    }
  }
  return null
}

// 問題のあるsentenceから正しいIDを取得
const problemIds: Record<string, string> = {}

// Elementary3
const e3Id = findProblemIdBySentence('elementary3', '[記事|きじ]を読んで、[世界|せかい]の出来事')
if (e3Id) problemIds[e3Id] = '新聞[記|き]事を読んで時事問題を学びました。'

// Elementary4
const e4Id1 = findProblemIdBySentence('elementary4', '面白い[笑|き]劇を見て大笑い')
if (e4Id1) problemIds[e4Id1] = 'コメディー映画を見て大[笑|わら]いしました。'

const e4Id2 = findProblemIdBySentence('elementary4', '鹿[鹿|か]島神宮')
if (e4Id2) problemIds[e4Id2] = '鹿島神宮で[鹿|しか]のお守りを買いました。'

// Elementary5
const e5Id = findProblemIdBySentence('elementary5', '石油[燃|ねん]料を燃やし')
if (e5Id) problemIds[e5Id] = '石油を[燃|ねん]料として使用しました。'

// Elementary6
const e6Id1 = findProblemIdBySentence('elementary6', '物語を創[創|そう]する楽しさ')
if (e6Id1) problemIds[e6Id1] = '物語を[創|そう]作する楽しさを知りました。'

const e6Id2 = findProblemIdBySentence('elementary6', '勤[勤|きん]な態度')
if (e6Id2) problemIds[e6Id2] = '[勤|きん]勉な態度で仕事に取り組みました。'

const e6Id3 = findProblemIdBySentence('elementary6', '重要な決定を宣[宣|せん]する')
if (e6Id3) problemIds[e6Id3] = '重要な方針を[宣|せん]言する時が来ました。'

// その他のelementary6の重複も検索
const otherE6Problems = [
  '将[将|しょう]の対局',
  '幼[幼|よう]園で子どもたち',
  '創[創|そう]的な',
  '親[親|しん]切',
  '私[私|し]的',
  '老[老|ろう]後',
  '観[観|かん]光',
  '注[注|ちゅう]意',
  '針[針|はり]仕事',
]

for (const problem of otherE6Problems) {
  const id = findProblemIdBySentence('elementary6', problem)
  if (id) {
    if (problem.includes('将[将|しょう]')) problemIds[id] = '[将|しょう]棋の対局を楽しんでいます。'
    else if (problem.includes('幼[幼|よう]')) problemIds[id] = '[幼|よう]稚園で子どもたちが元気に遊んでいます。'
    else if (problem.includes('創[創|そう]的')) problemIds[id] = '独[創|そう]的なアイデアが評価されました。'
    else if (problem.includes('親[親|しん]')) problemIds[id] = '[親|しん]切な対応に感謝しました。'
    else if (problem.includes('私[私|し]')) problemIds[id] = '[私|し]的な意見を述べました。'
    else if (problem.includes('老[老|ろう]')) problemIds[id] = '[老|ろう]後の生活を考えました。'
    else if (problem.includes('観[観|かん]')) problemIds[id] = '[観|かん]光地を訪れました。'
    else if (problem.includes('注[注|ちゅう]')) problemIds[id] = '[注|ちゅう]意深く話を聞きました。'
    else if (problem.includes('針[針|はり]')) problemIds[id] = '[針|はり]仕事を丁寧に行いました。'
  }
}

// Junior
const juniorProblems = ['[修|しゅう]遂について修練', '較[較|かく]してみ', '布団を[乾|ほ]して乾か', '嬉しい感情を[感|かん]じ', '指[振|き]者がタクトを振り']

for (const problem of juniorProblems) {
  const id = findProblemIdBySentence('junior', problem)
  if (id) {
    if (problem.includes('[修|しゅう]')) problemIds[id] = '任務を[修|しゅう]了しました。'
    else if (problem.includes('較[較|かく]')) problemIds[id] = '数値を[較|かく]べてみました。'
    else if (problem.includes('[乾|ほ]')) problemIds[id] = '洗濯物を[乾|かわ]かしました。'
    else if (problem.includes('[感|かん]')) problemIds[id] = '深い[感|かん]動を覚えました。'
    else if (problem.includes('[振|き]')) problemIds[id] = '指揮者がタクトを[振|ふ]りました。'
  }
}

console.log('見つかったID:', problemIds)

// ファイル処理
function processFile(filePath: string): number {
  const data: QuestionsFile = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let modifiedCount = 0

  for (const question of data.questions) {
    if (problemIds[question.id]) {
      question.sentence = problemIds[question.id]
      modifiedCount++
    }
  }

  if (modifiedCount > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
  }

  return modifiedCount
}

// 全ファイルを処理
const patterns = [
  /questions-elementary3-part\d+\.json$/,
  /questions-elementary4-part\d+\.json$/,
  /questions-elementary5-part\d+\.json$/,
  /questions-elementary6-part\d+\.json$/,
  /questions-junior-part\d+\.json$/,
]

let totalFixed = 0

for (const pattern of patterns) {
  const files = fs
    .readdirSync(questionsDir)
    .filter((file) => pattern.test(file))
    .sort()

  for (const file of files) {
    const filePath = path.join(questionsDir, file)
    const fixed = processFile(filePath)
    if (fixed > 0) {
      console.log(`✅ ${file}: ${fixed}個の問題を修正`)
      totalFixed += fixed
    }
  }
}

console.log(`\n合計 ${totalFixed} 個の問題を修正しました。`)
