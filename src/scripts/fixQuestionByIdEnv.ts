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

// 環境変数から取得
const targetId = process.env.FIX_ID;
const newSentence = process.env.FIX_SENTENCE;

if (!targetId || !newSentence) {
  console.error('使用方法: FIX_ID=<ID> FIX_SENTENCE=<新しい文章> npx tsx src/scripts/fixQuestionByIdEnv.ts');
  console.error('例: FIX_ID=e5-159 FIX_SENTENCE="[貧|ひん]しい生活を送りました。" npx tsx src/scripts/fixQuestionByIdEnv.ts');
  process.exit(1);
}

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