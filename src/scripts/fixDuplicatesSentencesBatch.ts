import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Question {
  id: string;
  sentence: string;
}

interface QuestionsFile {
  questions: Question[];
}

// 重複文章の修正パターン
const duplicateFixPatterns: Record<string, string[]> = {
  "ねこの[毛|け]がふわふわです。": [
    "白いねこの[毛|け]がふわふわです。",
    "子ねこの[毛|け]がとてもふわふわです。"
  ],
  "こちらの[方|ほう]がよいです。": [
    "こちらの[方|ほう]の道がよいです。",
    "こちらの[方|ほう]角がよいです。"
  ],
  "おんがくを[聞|き]きました。": [
    "美しいおんがくを[聞|き]きました。",
    "教室でおんがくを[聞|き]きました。"
  ],
  "昨日[本|ほん]を[読|よ]みました。": [
    "昨日図書館で[本|ほん]を[読|よ]みました。",
    "昨日面白い[本|ほん]を[読|よ]みました。"
  ],
  "きれいな[絵|え]をかきました。": [
    "きれいな[絵|え]を上手にかきました。",
    "友達ときれいな[絵|え]をかきました。"
  ],
  "せんせいが[教|おし]えてくれました。": [
    "やさしいせんせいが[教|おし]えてくれました。",
    "せんせいが丁寧に[教|おし]えてくれました。"
  ],
  "ことりが[鳴|な]いています。": [
    "窓の外でことりが[鳴|な]いています。",
    "朝からことりが美しく[鳴|な]いています。"
  ],
  "[工|こう]じょうをみました。": [
    "大きな[工|こう]じょうをみました。",
    "家族で[工|こう]じょう見学をしました。"
  ],
  "しろい[馬|ば]がいました。": [
    "野原にしろい[馬|ば]がいました。",
    "牧場でしろい[馬|ば]を見ました。"
  ],
  "[牛|ぎゅう]にゅうをのみました。": [
    "朝食で[牛|ぎゅう]にゅうをのみました。",
    "冷たい[牛|ぎゅう]にゅうをのみました。"
  ]
};

function fixDuplicates(filePath: string): number {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data: QuestionsFile = JSON.parse(content);
    let fixedCount = 0;
    const usedVariations = new Set<string>();

    for (const question of data.questions) {
      const sentence = question.sentence;
      
      if (duplicateFixPatterns[sentence]) {
        const variations = duplicateFixPatterns[sentence];
        
        // まだ使われていない最初のバリエーションを使用
        for (const variation of variations) {
          if (!usedVariations.has(variation)) {
            question.sentence = variation;
            usedVariations.add(variation);
            fixedCount++;
            break;
          }
        }
      }
    }

    if (fixedCount > 0) {
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`${filePath}: ${fixedCount}件の重複文章を修正しました`);
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
  'questions-elementary2-part1.json',
  'questions-elementary2-part2.json',
  'questions-elementary3-part2.json',
  'questions-elementary3-part4.json',
  'questions-elementary3-part5.json'
];

let totalFixed = 0;
for (const file of files) {
  const filePath = join(questionsDir, file);
  totalFixed += fixDuplicates(filePath);
}

console.log(`\n合計 ${totalFixed} 件の重複文章を修正しました。`);