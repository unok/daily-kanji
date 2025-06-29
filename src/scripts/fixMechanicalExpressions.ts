import * as fs from 'fs'
import * as path from 'path'

interface Question {
  id: string
  sentence: string
}

interface QuestionsFile {
  questions: Question[]
}

// 機械的な表現を自然な文に変換する関数
function fixMechanicalExpression(sentence: string): string {
  // 共通の機械的表現パターン
  const patterns = [
    // "について修練ました" -> 漢字に応じた自然な文
    {
      pattern: /\[共\|とも\]について修練ました(よ)?。?/,
      replacement: '[共|とも]に頑張って目標を達成しました。',
    },
    {
      pattern: /\[叫\|さけ\]について修練ました(よ)?。?/,
      replacement: '大きな声で[叫|さけ]んで助けを求めました。',
    },
    {
      pattern: /\[狂\|きょう\]について修練ました(よ)?。?/,
      replacement: '[狂|きょう]気じみた行動は慎むべきです。',
    },
    {
      pattern: /\[京\|きょう\]について修練ました(よ)?。?/,
      replacement: '東[京|きょう]の観光地を巡りました。',
    },
    {
      pattern: /\[京\|きょう\]へついて修練ました。?/,
      replacement: '東[京|きょう]へ修学旅行に行きます。',
    },
    {
      pattern: /\[享\|きょう\]について修練ました(よ)?。?/,
      replacement: '[享|きょう]受する喜びを感じています。',
    },
    {
      pattern: /\[供\|きょう\]について修練ました(よ)?。?/,
      replacement: '食べ物を[供|きょう]給する仕組みを学びました。',
    },
    {
      pattern: /\[協\|きょう\]について修練ました(よ)?。?/,
      replacement: 'みんなで[協|きょう]力して問題を解決しました。',
    },
    {
      pattern: /\[協\|きょう\]へついて修練ました。?/,
      replacement: '[協|きょう]会に参加することになりました。',
    },
    {
      pattern: /\[況\|きょう\]について修練ました(よ)?。?/,
      replacement: '現在の状[況|きょう]を把握しています。',
    },
    {
      pattern: /\[況\|きょう\]へついて修練ました。?/,
      replacement: '景気の状[況|きょう]が改善されています。',
    },
    {
      pattern: /この\[況\|きょう\]について修練ました。?/,
      replacement: 'この状[況|きょう]を打開する必要があります。',
    },
    {
      pattern: /\[競\|きょう\]について修練ました(よ)?。?/,
      replacement: '運動会で[競|きょう]争して頑張りました。',
    },
    {
      pattern: /\[恐\|きょう\]について修練ました(よ)?。?/,
      replacement: '[恐|きょう]竜の化石を博物館で見ました。',
    },
    {
      pattern: /\[恭\|きょう\]について修練ました(よ)?。?/,
      replacement: '[恭|きょう]順な態度で接しています。',
    },
    {
      pattern: /\[恭\|きょう\]へついて修練ました。?/,
      replacement: '[恭|うやうや]しく挨拶をしました。',
    },
    {
      pattern: /\[挟\|はさ\]について修練ました。?/,
      replacement: '本の間に栞を[挟|はさ]みました。',
    },
    {
      pattern: /\[教\|きょう\]について修練ました(よ)?。?/,
      replacement: '先生が親切に[教|おし]えてくれました。',
    },
    {
      pattern: /\[響\|きょう\]について修練ました(よ)?。?/,
      replacement: '音楽が会場に[響|ひび]き渡りました。',
    },
    {
      pattern: /\[橋\|はし\]について学習しました。?/,
      replacement: '大きな[橋|はし]を渡って向こう岸へ行きました。',
    },
    {
      pattern: /\[郷\|きょう\]について修練ました(よ)?。?/,
      replacement: '故[郷|きょう]に帰省する予定です。',
    },
    {
      pattern: /\[鏡\|かがみ\]について修練ました(よ)?。?/,
      replacement: '[鏡|かがみ]に自分の姿を映しました。',
    },
    {
      pattern: /\[業\|ぎょう\]について修練ました。?/,
      replacement: '卒[業|ぎょう]式の準備を進めています。',
    },
    {
      pattern: /\[曲\|きょく\]について修練ました(よ)?。?/,
      replacement: '新しい[曲|きょく]を聴いて感動しました。',
    },
    {
      pattern: /\[局\|きょく\]について修練ました(よ)?。?/,
      replacement: '郵便[局|きょく]で切手を買いました。',
    },
    {
      pattern: /\[極\|きょく\]について修練ました(よ)?。?/,
      replacement: '北[極|きょく]の氷が溶けているそうです。',
    },
    // "を使って文を製ります" -> 自然な文
    {
      pattern: /を使って文を製ります。?/,
      replacement: 'を正しく使うことが大切です。',
    },
    {
      pattern: /を使って文を製りました。?/,
      replacement: 'という言葉の意味を理解しました。',
    },
    // part9以降の機械的表現
    {
      pattern: /\[健\|けん\]について修練ました(よ)?。?/,
      replacement: '[健|けん]康が何より大切です。',
    },
    {
      pattern: /\[健\|けん\]へついて修練ました。?/,
      replacement: '[健|けん]康診断を受けました。',
    },
    {
      pattern: /\[券\|けん\]について修練ました(よ)?。?/,
      replacement: '乗車[券|けん]を購入しました。',
    },
    {
      pattern: /\[研\|けん\]について修練ました(よ)?。?/,
      replacement: '[研|けん]究に熱心に取り組んでいます。',
    },
    {
      pattern: /\[検\|けん\]について修練ました(よ)?。?/,
      replacement: '[検|けん]査の結果を待っています。',
    },
    {
      pattern: /\[検\|けん\]へついて修練ました。?/,
      replacement: '[検|けん]討を重ねて決めました。',
    },
    {
      pattern: /\[絹\|きぬ\]について修練ました(よ)?。?/,
      replacement: '[絹|きぬ]の布は肌触りが良いです。',
    },
    {
      pattern: /\[県\|けん\]について修練ました(よ)?。?/,
      replacement: '隣の[県|けん]へ旅行に行きました。',
    },
    {
      pattern: /\[肩\|かた\]について修練ました(よ)?。?/,
      replacement: '[肩|かた]こりがひどくて困っています。',
    },
    {
      pattern: /\[建\|けん\]について修練ました。?/,
      replacement: '新しい[建|けん]物が完成しました。',
    },
    {
      pattern: /\[憲\|けん\]について修練ました(よ)?。?/,
      replacement: '[憲|けん]法について学習しています。',
    },
    {
      pattern: /\[憲\|けん\]へついて修練ました。?/,
      replacement: '[憲|けん]法の大切さを理解しました。',
    },
    // part10以降の表現
    {
      pattern: /について(深く)?修練ました(よ)?。?/,
      replacement: 'について理解を深めました。',
    },
    {
      pattern: /の(麗しさ|重要さ|意義|役割|歴史|特徴|仕組み|手法|技術|構造|形成|配置|意味|種類|原理)について修練ました(よ)?。?/,
      replacement: 'について学習しました。',
    },
  ]

  let fixedSentence = sentence

  // パターンマッチングで修正
  for (const { pattern, replacement } of patterns) {
    if (pattern.test(fixedSentence)) {
      fixedSentence = fixedSentence.replace(pattern, replacement)
      return fixedSentence
    }
  }

  return fixedSentence
}

// ファイルを修正する関数
function fixFile(filePath: string): number {
  const content = fs.readFileSync(filePath, 'utf-8')
  const data: QuestionsFile = JSON.parse(content)

  let fixedCount = 0

  for (const question of data.questions) {
    const originalSentence = question.sentence
    const fixedSentence = fixMechanicalExpression(originalSentence)

    if (originalSentence !== fixedSentence) {
      question.sentence = fixedSentence
      fixedCount++
      console.log(`Fixed ${question.id}: ${originalSentence} -> ${fixedSentence}`)
    }
  }

  if (fixedCount > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n')
    console.log(`Fixed ${fixedCount} sentences in ${path.basename(filePath)}`)
  }

  return fixedCount
}

// メイン処理
function main() {
  const questionsDir = path.join(process.cwd(), 'src', 'data', 'questions')

  // 処理するファイルのリスト - 中学校のファイルをすべて対象に
  const filesToProcess = []
  for (let i = 1; i <= 39; i++) {
    filesToProcess.push(`questions-junior-part${i}.json`)
  }

  for (const fileName of filesToProcess) {
    const filePath = path.join(questionsDir, fileName)
    if (fs.existsSync(filePath)) {
      console.log(`\nProcessing ${fileName}...`)
      fixFile(filePath)
    }
  }
}

main()
