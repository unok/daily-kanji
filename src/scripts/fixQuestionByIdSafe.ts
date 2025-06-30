import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Question {
  id: string;
  sentence: string;
}

interface QuestionsFile {
  questions: Question[];
}

// コマンドライン引数を取得
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('使用方法: npx tsx src/scripts/fixQuestionByIdSafe.ts <ID> <新しい文章>');
  console.error('例: npx tsx src/scripts/fixQuestionByIdSafe.ts e5-159 "[貧|ひん]しい生活を送りました。"');
  process.exit(1);
}

const targetId = args[0];
// 残りの引数を結合（スペースが含まれる場合の対応）
const newSentence = args.slice(1).join(' ');

// questionsディレクトリのパス
const questionsDir = path.join(__dirname, '..', 'data', 'questions');

// 全ての問題ファイルを検索
let found = false;
const files = fs.readdirSync(questionsDir).filter(file => 
  file.startsWith('questions-') && file.endsWith('.json')
);

for (const file of files) {
  const filePath = path.join(questionsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  try {
    const data: QuestionsFile = JSON.parse(content);
    
    // 対象のIDを検索
    const questionIndex = data.questions.findIndex(q => q.id === targetId);
    
    if (questionIndex !== -1) {
      console.log(`\n✅ ID "${targetId}" を ${file} で発見しました`);
      console.log(`\n変更前:`);
      console.log(`  ID: ${data.questions[questionIndex].id}`);
      console.log(`  文章: ${data.questions[questionIndex].sentence}`);
      
      // 文章を更新
      data.questions[questionIndex].sentence = newSentence;
      
      console.log(`\n変更後:`);
      console.log(`  ID: ${data.questions[questionIndex].id}`);
      console.log(`  文章: ${data.questions[questionIndex].sentence}`);
      
      // ファイルに書き戻す
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
      
      console.log(`\n✅ ${file} を更新しました`);
      found = true;
      break;
    }
  } catch (error) {
    console.error(`❌ ${file} の処理中にエラーが発生しました:`, error);
  }
}

if (!found) {
  console.error(`\n❌ ID "${targetId}" が見つかりませんでした`);
  process.exit(1);
}