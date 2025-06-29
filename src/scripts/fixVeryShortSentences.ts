import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Question {
  id: string;
  sentence: string;
}

interface QuestionsFile {
  questions: Question[];
}

// 非常に短い文章（4-6文字）の修正パターン
const veryShortFixes: Record<string, string> = {
  "[功|こう]労者。": "国のために働いた[功|こう]労者を表彰しました。",
  "[労|ろう]働者。": "工場で働く[労|ろう]働者の皆さんに感謝しています。",
  "[労|いた]わる。": "お年寄りを大切に[労|いた]わることが大事です。",
  "[包|ほう]装紙。": "プレゼントを美しい[包|ほう]装紙で包みました。",
  "体が[健|けん]康。": "毎日運動して体が[健|けん]康になりました。",
  "[健|けん]全な心。": "読書によって[健|けん]全な心が育ちます。",
  "[億|おく]万長者。": "宝くじが当たって[億|おく]万長者になりました。",
  "[億|おく]の単位。": "人口を表すとき[億|おく]の単位を使います。",
  "大きな[兆|ちょう]。": "成功の大きな[兆|ちょう]しが見えてきました。"
};

function fixVeryShortSentences(filePath: string): number {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data: QuestionsFile = JSON.parse(content);
    let fixedCount = 0;

    for (const question of data.questions) {
      const originalSentence = question.sentence;
      
      // 文字数をカウント（読み仮名部分を除く）
      const displayText = originalSentence.replace(/\[([^\]]+)\|[^\]]+\]/g, '$1');
      
      if (displayText.length <= 6) {
        // 直接マッピングがある場合
        if (veryShortFixes[originalSentence]) {
          question.sentence = veryShortFixes[originalSentence];
          fixedCount++;
          continue;
        }

        // パターンマッチングで自動拡張
        let newSentence = originalSentence;
        
        if (displayText.endsWith("。")) {
          // 名詞で終わる場合
          if (displayText.includes("者")) {
            newSentence = "多くの" + originalSentence.replace("。", "が活躍しています。");
          } else if (displayText.includes("紙")) {
            newSentence = "きれいな" + originalSentence.replace("。", "を使いました。");
          } else if (displayText.includes("心")) {
            newSentence = originalSentence.replace("。", "を持つことが大切です。");
          } else if (displayText.includes("単位")) {
            newSentence = originalSentence.replace("。", "について勉強しました。");
          } else if (displayText.includes("兆")) {
            newSentence = originalSentence.replace("。", "が現れました。");
          } else {
            // 一般的な拡張
            newSentence = "これは" + originalSentence.replace("。", "のことです。");
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
      console.log(`${filePath}: ${fixedCount}件の非常に短い文章を修正しました`);
    }

    return fixedCount;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return 0;
  }
}

// elementary4-part6を処理
const questionsDir = join(process.cwd(), 'src/data/questions');
const filePath = join(questionsDir, 'questions-elementary4-part6.json');

const totalFixed = fixVeryShortSentences(filePath);
console.log(`\n合計 ${totalFixed} 件の非常に短い文章を修正しました。`);