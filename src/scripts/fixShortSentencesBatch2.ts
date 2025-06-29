import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Question {
  id: string;
  sentence: string;
}

interface QuestionsFile {
  questions: Question[];
}

function fixShortSentencesAdvanced(filePath: string): number {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data: QuestionsFile = JSON.parse(content);
    let fixedCount = 0;

    for (const question of data.questions) {
      const originalSentence = question.sentence;
      
      // 文字数をカウント（読み仮名部分を除く）
      const displayText = originalSentence.replace(/\[([^\]]+)\|[^\]]+\]/g, '$1');
      
      if (displayText.length < 9) {
        let newSentence = originalSentence;
        
        // より詳細なパターンマッチング
        if (displayText.endsWith("ます。")) {
          // 動詞文の拡張
          if (displayText.includes("勝")) {
            newSentence = "試合で相手に" + originalSentence;
          } else if (displayText.includes("負")) {
            newSentence = "悔しくて" + originalSentence;
          } else if (displayText.includes("任")) {
            newSentence = "大切な仕事を" + originalSentence;
          } else if (displayText.includes("務")) {
            newSentence = "皆で力を合わせて" + originalSentence;
          } else if (displayText.includes("成")) {
            newSentence = "努力が実って" + originalSentence;
          } else if (displayText.includes("果")) {
            newSentence = "約束を必ず" + originalSentence;
          } else if (displayText.includes("徴")) {
            newSentence = "優秀な成績で" + originalSentence;
          } else if (displayText.includes("得")) {
            newSentence = "たくさんの経験を" + originalSentence;
          } else if (displayText.includes("損")) {
            newSentence = "注意しないと" + originalSentence;
          } else {
            newSentence = "今日" + originalSentence;
          }
        } else if (displayText.endsWith("です。")) {
          // 名詞文の拡張
          if (displayText.includes("技")) {
            newSentence = "彼の得意な" + originalSentence;
          } else if (displayText.includes("術")) {
            newSentence = "高度な" + originalSentence;
          } else if (displayText.includes("備")) {
            newSentence = "完璧な" + originalSentence;
          } else if (displayText.includes("設")) {
            newSentence = "新しい" + originalSentence;
          } else if (displayText.includes("版")) {
            newSentence = "最新の" + originalSentence;
          } else if (displayText.includes("刻")) {
            newSentence = "記念に" + originalSentence;
          } else {
            newSentence = "これは" + originalSentence;
          }
        } else if (displayText.endsWith("。")) {
          // その他の拡張
          if (displayText.includes("年")) {
            newSentence = originalSentence.replace("。", "のことを覚えています。");
          } else if (displayText.includes("方")) {
            newSentence = originalSentence.replace("。", "について教わりました。");
          } else if (displayText.includes("式")) {
            newSentence = originalSentence.replace("。", "に参加しました。");
          } else {
            newSentence = "私たちは" + originalSentence;
          }
        }
        
        const newDisplayText = newSentence.replace(/\[([^\]]+)\|[^\]]+\]/g, '$1');
        if (newDisplayText.length >= 9 && newSentence !== originalSentence) {
          question.sentence = newSentence;
          fixedCount++;
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

// 複数のファイルを処理
const questionsDir = join(process.cwd(), 'src/data/questions');
const files = [
  'questions-elementary4-part5.json',
  'questions-elementary4-part4.json',
  'questions-elementary4-part3.json',
  'questions-elementary4-part8.json',
  'questions-elementary1-part7.json'
];

let totalFixed = 0;
for (const file of files) {
  const filePath = join(questionsDir, file);
  totalFixed += fixShortSentencesAdvanced(filePath);
}

console.log(`\n合計 ${totalFixed} 件の短い文章を修正しました。`);