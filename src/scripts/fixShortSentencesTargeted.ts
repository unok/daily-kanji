import * as fs from 'fs/promises';
import * as path from 'path';

interface Question {
  id: string;
  sentence: string;
}

interface QuestionFile {
  questions: Question[];
}

// 短い文章を自然に拡張するための修正パターン
const expansionPatterns: Record<string, (sentence: string) => string> = {
  // 5文字パターン
  '学年です。': () => '彼は同じ[学年|がくねん]の友達です。',
  '村人です。': () => '彼女は優しい[村人|むらびと]です。',
  '町人です。': () => '商売をする[町人|ちょうにん]でした。',
  
  // 6文字パターン
  '女の子です。': () => '元気な[女|おんな]の[子|こ]が遊んでいます。',
  '力と水です。': () => '[力|ちから]と[水|みず]が必要な仕事です。',
  '円い月です。': () => '夜空に[円|まる]い[月|つき]が輝いています。',
  '先月でした。': () => 'その出来事は[先月|せんげつ]のことでした。',
  '王の子です。': () => '彼は偉大な[王|おう]の[子|こ]として生まれました。',
  
  // 7文字パターン（よく見る型）
  '見ました。': (sentence: string) => {
    const target = sentence.match(/(.+)を[見|み]ました。/);
    if (target) {
      const obj = target[1];
      const patterns = [
        `昨日${obj}を[見|み]ました。`,
        `初めて${obj}を[見|み]ました。`,
        `遠くから${obj}を[見|み]ました。`,
        `みんなで${obj}を[見|み]ました。`
      ];
      return patterns[Math.floor(Math.random() * patterns.length)];
    }
    return sentence;
  },
  
  '出ました。': (sentence: string) => {
    const patterns = [
      sentence.replace('出ました', '出ましたね'),
      sentence.replace('が出ました', 'がたくさん出ました'),
      sentence.replace('に出ます', 'に元気よく出ます'),
      sentence.replace('へ出ました', 'へ急いで出ました')
    ];
    return patterns.find(p => p !== sentence) || `朝早く${sentence}`;
  },
  
  'です。': (sentence: string) => {
    if (sentence.includes('の')) {
      return sentence.replace('です。', 'なのです。');
    }
    return `それは${sentence}`;
  }
};

async function fixShortSentences(targetFile: string) {
  const questionsDir = path.join(process.cwd(), 'src', 'data', 'questions');
  const filePath = path.join(questionsDir, targetFile);
  
  const content = await fs.readFile(filePath, 'utf-8');
  const data: QuestionFile = JSON.parse(content);
  
  let fixedCount = 0;
  
  data.questions = data.questions.map(q => {
    const cleanSentence = q.sentence.replace(/\[[^\]]+\|[^\]]+\]/g, (match) => {
      return match.split('|')[0].slice(1);
    });
    
    if (cleanSentence.length < 9) {
      // 特定のパターンを探す
      for (const [pattern, transformer] of Object.entries(expansionPatterns)) {
        if (cleanSentence === pattern || cleanSentence.endsWith(pattern)) {
          const newSentence = transformer(cleanSentence);
          if (newSentence !== cleanSentence) {
            console.log(`  ✅ ID: ${q.id}`);
            console.log(`     旧: ${cleanSentence} (${cleanSentence.length}文字)`);
            console.log(`     新: ${newSentence.replace(/\[[^\]]+\|[^\]]+\]/g, m => m.split('|')[0].slice(1))} (${newSentence.replace(/\[[^\]]+\|[^\]]+\]/g, m => m.split('|')[0].slice(1)).length}文字)`);
            fixedCount++;
            return { ...q, sentence: newSentence };
          }
        }
      }
      
      // 汎用的な拡張
      if (cleanSentence.length <= 7) {
        let newSentence = q.sentence;
        
        // 基本的な拡張パターン
        if (cleanSentence.endsWith('です。')) {
          newSentence = `これは${q.sentence}`;
        } else if (cleanSentence.endsWith('ます。')) {
          newSentence = `今日も${q.sentence}`;
        } else if (cleanSentence.includes('を')) {
          newSentence = `みんなで${q.sentence}`;
        }
        
        const newClean = newSentence.replace(/\[[^\]]+\|[^\]]+\]/g, m => m.split('|')[0].slice(1));
        if (newClean.length >= 9 && newClean !== cleanSentence) {
          console.log(`  ✅ ID: ${q.id}`);
          console.log(`     旧: ${cleanSentence} (${cleanSentence.length}文字)`);
          console.log(`     新: ${newClean} (${newClean.length}文字)`);
          fixedCount++;
          return { ...q, sentence: newSentence };
        }
      }
    }
    
    return q;
  });
  
  if (fixedCount > 0) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`\n✅ ${targetFile}: ${fixedCount} 件の短い文章を修正しました。`);
  } else {
    console.log(`\n ℹ️ ${targetFile}: 修正対象の文章が見つかりませんでした。`);
  }
  
  return fixedCount;
}

// メイン処理
async function main() {
  const targetFiles = [
    'questions-elementary1-part6.json',  // 最も短い文章が多い
    'questions-elementary1-part5.json',
    'questions-elementary1-part3.json',
    'questions-elementary1-part4.json'
  ];
  
  console.log('🔧 短い文章の修正を開始します...\n');
  
  let totalFixed = 0;
  for (const file of targetFiles) {
    try {
      const fixed = await fixShortSentences(file);
      totalFixed += fixed;
    } catch (error) {
      console.error(`❌ ${file} の処理中にエラー: ${error}`);
    }
  }
  
  console.log(`\n✨ 合計 ${totalFixed} 件の短い文章を修正しました。`);
}

main().catch(console.error);