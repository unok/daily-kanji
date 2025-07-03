import { addQuestionToFile } from './utils/questionManager.js'

async function addQuestion(grade: string, sentence: string): Promise<void> {
  await addQuestionToFile(grade, sentence)
}

// コマンドライン引数から実行
async function main() {
  const args = process.argv.slice(2)

  if (args.length !== 2) {
    console.error('使用方法: npx tsx src/scripts/addQuestion.ts <grade> "<sentence>"')
    console.error('例: npx tsx src/scripts/addQuestion.ts 1 "[本|ほん]を読みました。"')
    console.error('例: npx tsx src/scripts/addQuestion.ts junior "[憂|ゆう]鬱な気分になりました。"')
    process.exit(1)
  }

  const [grade, sentenceArg] = args

  // シェルによって挿入された ' < /dev/null | ' を '|' に戻す
  const sentence = sentenceArg.replace(/ < \/dev\/null \| /g, '|')

  try {
    await addQuestion(grade, sentence)
  } catch (error) {
    console.error('エラー:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
