import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Question {
  id: string;
  sentence: string;
}

interface QuestionsFile {
  questions: Question[];
}

// 短い文章を修正するためのマッピング
const shortSentenceFixes: Record<string, string> = {
  // elementary2-part9.json
  "[夏|なつ]休み旅行。": "家族で[夏|なつ]休み旅行に行きました。",
  "[算|さん]数の時間。": "[算|さん]数の授業時間が始まりました。",
  "[計|けい]算します。": "宿題の[計|けい]算をしっかりします。",
  "[計|けい]算が早い。": "彼女は[計|けい]算が早くて上手です。",
  
  // 一般的な短い文章パターン
  "転びました。": "階段で転んでしまいました。",
  "開けてください。": "扉を静かに開けてください。",
  "面白い話でした。": "昨日聞いた面白い話でした。",
  "温かい日でした。": "今日は春らしく温かい日でした。",
  "面白い本でした。": "図書館で借りた面白い本でした。",
  "重要な話ですよ。": "これはとても重要な話ですよ。",
  "決心しましたよ。": "ついに留学することを決心しましたよ。",
  "注文しましたよ。": "レストランで料理を注文しましたよ。",
  "登校しましたよ。": "今朝は早起きして登校しましたよ。"
};

// 語幹を拡張するための接頭辞・接尾辞
const expansionPatterns: Array<{match: RegExp, replace: string}> = [
  // 基本的な動詞の拡張
  {match: /^(.+)ます。$/, replace: "今日$1ました。"},
  {match: /^(.+)でした。$/, replace: "とても$1でした。"},
  {match: /^(.+)です。$/, replace: "それは$1です。"},
  {match: /^(.+)を(.+)。$/, replace: "毎日$1を$2ています。"},
  {match: /^(.+)が(.+)。$/, replace: "$1がとても$2です。"},
  {match: /^(.+)に(.+)。$/, replace: "みんなで$1に$2ました。"},
];

function fixShortSentences(filePath: string): number {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data: QuestionsFile = JSON.parse(content);
    let fixedCount = 0;

    for (const question of data.questions) {
      const originalSentence = question.sentence;
      
      // 文字数をカウント（読み仮名部分を除く）
      const displayText = originalSentence.replace(/\[([^\]]+)\|[^\]]+\]/g, '$1');
      
      if (displayText.length < 9) {
        // 直接マッピングがある場合
        if (shortSentenceFixes[originalSentence]) {
          question.sentence = shortSentenceFixes[originalSentence];
          fixedCount++;
          continue;
        }

        // パターンマッチングで拡張
        let fixed = false;
        for (const pattern of expansionPatterns) {
          if (pattern.match.test(displayText)) {
            const newDisplayText = displayText.replace(pattern.match, pattern.replace);
            // 読み仮名部分は保持
            const kanjiMatches = originalSentence.match(/\[([^\]]+)\|([^\]]+)\]/g);
            let newSentence = newDisplayText;
            
            if (kanjiMatches) {
              for (const match of kanjiMatches) {
                const [, kanji, reading] = match.match(/\[([^\]]+)\|([^\]]+)\]/)!;
                newSentence = newSentence.replace(kanji, `[${kanji}|${reading}]`);
              }
            }
            
            if (newSentence !== originalSentence && newSentence.replace(/\[([^\]]+)\|[^\]]+\]/g, '$1').length >= 9) {
              question.sentence = newSentence;
              fixedCount++;
              fixed = true;
              break;
            }
          }
        }

        // 基本的な拡張を試す
        if (!fixed) {
          let newSentence = originalSentence;
          
          if (displayText.endsWith("。")) {
            // 状況や場所を追加
            if (displayText.includes("勉強")) {
              newSentence = originalSentence.replace("。", "をしています。");
            } else if (displayText.includes("見")) {
              newSentence = "遠くの" + originalSentence;
            } else if (displayText.includes("行")) {
              newSentence = "家族と一緒に" + originalSentence;
            } else if (displayText.includes("食")) {
              newSentence = "美味しく" + originalSentence;
            } else {
              newSentence = "毎日" + originalSentence;
            }
          }
          
          const newDisplayText = newSentence.replace(/\[([^\]]+)\|[^\]]+\]/g, '$1');
          if (newDisplayText.length >= 9 && newSentence !== originalSentence) {
            question.sentence = newSentence;
            fixedCount++;
          }
        }
      }
    }

    if (fixedCount > 0) {
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`${filePath}: ${fixedCount}件の短い文章を修正しました`);
    }

    return fixedCount;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return 0;
  }
}

// 全ファイルを処理
const questionsDir = join(process.cwd(), 'src/data/questions');
const files = [
  'questions-elementary1-part5.json',
  'questions-elementary2-part6.json', 
  'questions-elementary2-part7.json',
  'questions-elementary2-part8.json',
  'questions-elementary2-part9.json',
  'questions-elementary3-part9.json'
];

let totalFixed = 0;
for (const file of files) {
  const filePath = join(questionsDir, file);
  totalFixed += fixShortSentences(filePath);
}

console.log(`\n合計 ${totalFixed} 件の短い文章を修正しました。`);