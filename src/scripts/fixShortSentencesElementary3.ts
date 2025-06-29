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
  // 具体的なパターン
  '福がきました。': () => '新年に[福|ふく]がきました。',
  '仕事をしました。': () => '今日も[仕|し]事をしました。',
  '勉きょうします。': () => '毎日[勉|べん]きょうします。',
  '対せんしました。': () => 'チームで[対|たい]せんしました。',
  '役にたちました。': () => 'とても[役|やく]にたちました。',
  '息をすいました。': () => '深く[息|いき]をすいました。',
  '指でさしました。': () => '前を[指|ゆび]でさしました。',
  '血が出ました。': () => '少し[血|ち]が出ました。',
  '表に出ました。': () => '外の[表|おもて]に出ました。',
  '軽い荷物です。': () => 'とても[軽|かる]い荷物です。',
  '決定しました。': () => '会議で[決|けっ]定しました。',
  '服を着ました。': () => '新しい服を[着|ちゃく]ました。',
  '終了しました。': () => '無事に[終|しゅう]了しました。',
  '苦労しました。': () => '本当に[苦|く]労しました。',
  '最終日です。': () => '今日が最[終|しゅう]日です。',
  '発見しました。': () => '偶然[発|はっ]見しました。',
  '登校しました。': () => '元気に[登|とう]校しました。',
  '失礼しました。': () => '本当に失[礼|れい]しました。',
  '第二回目です。': () => 'これが[第|だい]二回目です。',
  '学習しました。': () => '熱心に学[習|しゅう]しました。',
  '出血しました。': () => '少し出[血|けつ]しました。',
  
  // 動詞パターン
  'しました。': (sentence: string) => {
    const patterns = [
      `昨日${sentence}`,
      `みんなで${sentence}`,
      `一緒に${sentence}`,
      `無事に${sentence}`,
      `ついに${sentence}`
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
  },
  
  'します。': (sentence: string) => {
    const patterns = [
      `毎日${sentence}`,
      `これから${sentence}`,
      `必ず${sentence}`,
      `きちんと${sentence}`
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
  },
  
  'です。': (sentence: string) => {
    if (sentence.includes('の')) {
      return sentence.replace('です。', 'なのです。');
    }
    if (sentence.includes('い')) {
      return `とても${sentence}`;
    }
    return `これが${sentence}`;
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
            const newClean = newSentence.replace(/\[[^\]]+\|[^\]]+\]/g, m => m.split('|')[0].slice(1));
            if (newClean.length >= 9) {
              console.log(`  ✅ ID: ${q.id}`);
              console.log(`     旧: ${cleanSentence} (${cleanSentence.length}文字)`);
              console.log(`     新: ${newClean} (${newClean.length}文字)`);
              fixedCount++;
              return { ...q, sentence: newSentence };
            }
          }
        }
      }
      
      // 汎用的な拡張
      if (cleanSentence.length <= 8) {
        let newSentence = q.sentence;
        
        // 基本的な拡張パターン
        if (cleanSentence.endsWith('ました。')) {
          const prefixes = ['昨日', '今朝', '先週', '今日', '無事に', '一緒に'];
          const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
          newSentence = `${prefix}${q.sentence}`;
        } else if (cleanSentence.endsWith('します。')) {
          const prefixes = ['毎日', 'これから', '必ず', 'きちんと', '今日も'];
          const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
          newSentence = `${prefix}${q.sentence}`;
        } else if (cleanSentence.endsWith('です。')) {
          if (cleanSentence.includes('の') || cleanSentence.includes('が')) {
            newSentence = q.sentence.replace('です。', 'なのです。');
          } else {
            newSentence = `それは${q.sentence}`;
          }
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
    'questions-elementary3-part1.json',
    'questions-elementary3-part2.json',
    'questions-elementary3-part3.json',
    'questions-elementary3-part4.json',
    'questions-elementary3-part5.json',
    'questions-elementary3-part6.json'
  ];
  
  console.log('🔧 小学3年生の短い文章の修正を開始します...\n');
  
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