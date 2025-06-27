#!/usr/bin/env tsx

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ACTUAL_SENIOR_KANJI } from '../src/data/kanji-lists/jouyou-kanji'
import { parseQuestion } from '../src/utils/questionParser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

interface Question {
  id?: string
  sentence: string
}

interface QuestionsFile {
  questions: Question[]
}

// 各学年の問題ファイルを読み込む（分割されたパートファイルに対応）
function loadQuestions(grade: string): Question[] {
  const questionsDir = join(__dirname, '../src/data/questions')
  const allQuestions: Question[] = []

  try {
    // ディレクトリ内のファイルを取得
    const files = readdirSync(questionsDir)

    // 指定された学年のパートファイルを検索
    const pattern = new RegExp(`^questions-${grade}-part[0-9]+\\.json$`)
    const matchingFiles = files.filter((file) => pattern.test(file))

    if (matchingFiles.length === 0) {
      // パートファイルが見つからない場合は、単一ファイルを試す
      const singleFile = `questions-${grade}.json`
      if (files.includes(singleFile)) {
        const filePath = join(questionsDir, singleFile)
        const data = JSON.parse(readFileSync(filePath, 'utf8')) as QuestionsFile
        return data.questions
      }
      throw new Error(`No question files found for grade: ${grade}`)
    }

    // パートファイルを順番に読み込む
    matchingFiles.sort().forEach((file) => {
      const filePath = join(questionsDir, file)
      const data = JSON.parse(readFileSync(filePath, 'utf8')) as QuestionsFile
      if (data.questions) {
        allQuestions.push(...data.questions)
      }
    })

    return allQuestions
  } catch (error) {
    console.error(`Error loading questions for grade ${grade}:`, error)
    return []
  }
}

// 高校の漢字使用回数をカウント
function countSeniorKanjiUsage(): Map<string, number> {
  const seniorQuestions = loadQuestions('senior')
  console.log(`📝 読み込んだ高校問題数: ${seniorQuestions.length}個`)
  
  const seniorKanjiCount = new Map<string, number>()

  // 対象漢字のカウントを初期化
  for (const kanji of ACTUAL_SENIOR_KANJI) {
    seniorKanjiCount.set(kanji, 0)
  }

  console.log(`🎯 対象漢字数: ${ACTUAL_SENIOR_KANJI.length}個`)

  for (const question of seniorQuestions) {
    const parsed = parseQuestion(question.sentence)
    for (const input of parsed.inputs) {
      if (input.kanji) {
        const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
        for (const k of kanjiInAnswer) {
          if (seniorKanjiCount.has(k)) {
            seniorKanjiCount.set(k, (seniorKanjiCount.get(k) || 0) + 1)
          }
        }
      }
    }
  }

  // デバッグ情報を表示
  const totalUsages = Array.from(seniorKanjiCount.values()).reduce((sum, count) => sum + count, 0)
  console.log(`📊 漢字使用総数: ${totalUsages}回`)
  
  const under5 = Array.from(seniorKanjiCount.entries()).filter(([, count]) => count < 5)
  console.log(`⚠️  5回未満の漢字: ${under5.length}個`)
  
  if (under5.length > 0) {
    console.log('\n🔍 使用回数が5回未満の漢字詳細:')
    under5.slice(0, 20).forEach(([kanji, count]) => {
      console.log(`  ${kanji}: ${count}回`)
    })
    if (under5.length > 20) {
      console.log(`  ... 他${under5.length - 20}個`)
    }
  }

  return seniorKanjiCount
}

// 高校の漢字使用回数をカウント（追加問題ファイルを含む）
function countSeniorKanjiUsageWithAdditional(): Map<string, number> {
  const questionsDir = join(__dirname, '../src/data/questions')
  const allQuestions: Question[] = []

  try {
    // パートファイルを読み込み
    const files = readdirSync(questionsDir)
    const pattern = new RegExp(`^questions-senior-part[0-9]+\\.json$`)
    const matchingFiles = files.filter((file) => pattern.test(file))

    matchingFiles.sort().forEach((file) => {
      const filePath = join(questionsDir, file)
      const data = JSON.parse(readFileSync(filePath, 'utf8')) as QuestionsFile
      if (data.questions) {
        allQuestions.push(...data.questions)
      }
    })

    // 追加ファイルも読み込み
    const additionalFile = 'questions-senior-additional.json'
    if (files.includes(additionalFile)) {
      const filePath = join(questionsDir, additionalFile)
      const data = JSON.parse(readFileSync(filePath, 'utf8')) as QuestionsFile
      if (data.questions) {
        allQuestions.push(...data.questions)
      }
    }
  } catch (error) {
    console.error('Error loading questions with additional file:', error)
    return new Map()
  }

  console.log(`📝 読み込んだ高校問題数（追加含む）: ${allQuestions.length}個`)
  
  const seniorKanjiCount = new Map<string, number>()

  // 対象漢字のカウントを初期化
  for (const kanji of ACTUAL_SENIOR_KANJI) {
    seniorKanjiCount.set(kanji, 0)
  }

  for (const question of allQuestions) {
    const parsed = parseQuestion(question.sentence)
    for (const input of parsed.inputs) {
      if (input.kanji) {
        const kanjiInAnswer = input.kanji.match(/[\u4E00-\u9FAF]/g) || []
        for (const k of kanjiInAnswer) {
          if (seniorKanjiCount.has(k)) {
            seniorKanjiCount.set(k, (seniorKanjiCount.get(k) || 0) + 1)
          }
        }
      }
    }
  }

  // デバッグ情報を表示
  const totalUsages = Array.from(seniorKanjiCount.values()).reduce((sum, count) => sum + count, 0)
  console.log(`📊 漢字使用総数（追加含む）: ${totalUsages}回`)
  
  const under5 = Array.from(seniorKanjiCount.entries()).filter(([, count]) => count < 5)
  console.log(`⚠️  5回未満の漢字（追加含む）: ${under5.length}個`)

  return seniorKanjiCount
}

// 使用頻度が5回未満の漢字を特定
function findUnderrepresentedKanji(): Array<{ kanji: string; count: number; needed: number }> {
  const kanjiCounts = countSeniorKanjiUsage()
  const underrepresented: Array<{ kanji: string; count: number; needed: number }> = []

  for (const [kanji, count] of kanjiCounts.entries()) {
    if (count < 5) {
      underrepresented.push({
        kanji,
        count,
        needed: 5 - count
      })
    }
  }

  return underrepresented.sort((a, b) => b.needed - a.needed)
}

// 漢字の読みデータ（基本的な読み方）
const kanjiReadings: { [key: string]: string[] } = {
  '望': ['ぼう', 'のぞみ', 'もち'],
  '意': ['い'],
  '見': ['けん', 'み'],
  '全': ['ぜん', 'まった'],
  '要': ['よう', 'かなめ'],
  '品': ['ひん', 'しな'],
  '心': ['しん', 'こころ'],
  '識': ['しき'],
  '力': ['りょく', 'ちから'],
  '理': ['り'],
  '解': ['かい', 'げ'],
  '明': ['めい', 'あか'],
  '情': ['じょう'],
  '和': ['わ', 'なご'],
  '決': ['けつ', 'き'],
  '成': ['せい', 'な'],
  '大': ['だい', 'おお'],
  '続': ['ぞく', 'つづ'],
  '熱': ['ねつ', 'あつ'],
  '学': ['がく', 'まな'],
  '感': ['かん'],
  '実': ['じつ', 'み'],
  '証': ['しょう'],
  '素': ['そ', 'もと'],
  '因': ['いん'],
  '調': ['ちょう', 'しら'],
  '上': ['じょう', 'うえ'],
  '信': ['しん'],
  '高': ['こう', 'たか'],
  '無': ['む', 'な'],
  '論': ['ろん'],
  '別': ['べつ', 'わか'],
  '会': ['かい', 'あ'],
  '衡': ['こう'],
  '多': ['た', 'おお'],
  '真': ['しん', 'ま'],
  '平': ['へい', 'たい'],
  '進': ['しん', 'すす'],
  '分': ['ぶん', 'わ'],
  '観': ['かん'],
  '定': ['てい', 'さだ'],
  '主': ['しゅ', 'ぬし'],
  '完': ['かん'],
  '安': ['あん', 'やす'],
  '敏': ['びん'],
  '推': ['すい', 'お'],
  '楽': ['らく', 'たの'],
  '的': ['てき'],
  '均': ['きん'],
  '美': ['び', 'うつく'],
  '文': ['ぶん', 'ふみ'],
  '造': ['ぞう', 'つく'],
  '作': ['さく', 'つく'],
  '革': ['かく', 'かわ'],
  '改': ['かい', 'あらた'],
  '重': ['じゅう', 'おも'],
  '基': ['き', 'もと'],
  '厳': ['げん', 'きび'],
  '察': ['さつ'],
  '頼': ['らい', 'たよ'],
  '統': ['とう', 'す'],
  '練': ['れん', 'ね'],
  '永': ['えい', 'なが'],
  '潔': ['けつ', 'いさぎよ'],
  '豊': ['ほう', 'ゆた'],
  '最': ['さい', 'もっと'],
  '至': ['し', 'いた'],
  '予': ['よ'],
  '選': ['せん', 'えら'],
  '人': ['じん', 'ひと'],
  '間': ['かん', 'あいだ'],
  '究': ['きゅう', 'きわ'],
  '制': ['せい'],
  '持': ['じ', 'も'],
  '性': ['せい'],
  '術': ['じゅつ'],
  '華': ['か', 'はな'],
  '伝': ['でん', 'つた'],
  '析': ['せき'],
  '発': ['はつ', 'はっ'],
  '構': ['こう', 'かま'],
  '価': ['か', 'あたい'],
  '質': ['しつ'],
  '変': ['へん', 'か'],
  '点': ['てん'],
  '知': ['ち', 'し'],
  '動': ['どう', 'うご'],
  '栄': ['えい', 'さか'],
  '誠': ['せい', 'まこと'],
  '格': ['かく'],
  '向': ['こう', 'む'],
  '希': ['き'],
  '念': ['ねん'],
  '善': ['ぜん', 'よ'],
  '優': ['ゆう', 'やさ'],
  '整': ['せい', 'ととの'],
  '気': ['き'],
  '限': ['げん', 'かぎ'],
  '遠': ['えん', 'とお'],
  '継': ['けい', 'つ'],
  '任': ['にん'],
  '欲': ['よく', 'ほっ'],
  '本': ['ほん', 'もと'],
  '面': ['めん'],
  '直': ['ちょく', 'なお'],
  '純': ['じゅん'],
  '清': ['せい', 'きよ'],
  '鮮': ['せん', 'あざ'],
  '頂': ['ちょう', 'いただ'],
  '急': ['きゅう', 'いそ'],
  '速': ['そく', 'はや'],
  '機': ['き'],
  '細': ['さい', 'ほそ'],
  '中': ['ちゅう', 'なか'],
  '得': ['とく', 'え'],
  '義': ['ぎ'],
  '政': ['せい'],
  '議': ['ぎ'],
  '子': ['し', 'こ'],
  '原': ['げん', 'はら'],
  '微': ['び'],
  '視': ['し', 'み'],
  '世': ['せ', 'よ'],
  '生': ['せい', 'い'],
  '物': ['ぶつ', 'もの'],
  '様': ['よう', 'さま'],
  '保': ['ほ', 'たも'],
  '芸': ['げい'],
  '覚': ['かく', 'おぼ'],
  '経': ['けい', 'へ'],
  '必': ['ひつ', 'かなら'],
  '報': ['ほう'],
  '国': ['こく', 'くに'],
  '法': ['ほう'],
  '興': ['こう', 'おこ'],
  '歴': ['れき'],
  '史': ['し'],
  '過': ['か', 'す'],
  '程': ['てい', 'ほど'],
  '倫': ['りん'],
  '判': ['はん', 'わか'],
  '断': ['だん', 'た'],
  '値': ['ち', 'ね'],
  '相': ['そう', 'あい'],
  '対': ['たい', 'つい'],
  '考': ['こう', 'かんが'],
  '用': ['よう', 'もち'],
  '社': ['しゃ'],
  '前': ['ぜん', 'まえ'],
  '評': ['ひょう'],
  '認': ['にん', 'みと'],
  '盤': ['ばん'],
  '権': ['けん'],
  '威': ['い'],
  '享': ['きょう', 'う'],
  '敬': ['けい', 'うやま'],
  '愛': ['あい'],
  '卓': ['たく'],
  '洞': ['どう'],
  '慎': ['しん', 'つつし'],
  '想': ['そう', 'おも'],
  '志': ['し', 'こころざ'],
  '長': ['ちょう', 'なが'],
  '展': ['てん'],
  '歩': ['ほ', 'ある'],
  '福': ['ふく'],
  '友': ['ゆう', 'とも'],
  '一': ['いち', 'ひと'],
  '連': ['れん', 'つら'],
  '位': ['い'],
  '不': ['ふ', 'ぶ'],
  '久': ['きゅう', 'ひさ'],
  '承': ['しょう', 'う'],
  '話': ['わ', 'はな'],
  '交': ['こう', 'まじ'],
  '期': ['き'],
  '願': ['がん', 'ねが'],
  '求': ['きゅう', 'もと'],
  '命': ['めい', 'いのち'],
  '目': ['もく', 'め'],
  '率': ['りつ', 'ひき'],
  '簡': ['かん'],
  '麗': ['れい', 'うるわ'],
  '沢': ['たく', 'さわ'],
  '富': ['ふ', 'と'],
  '充': ['じゅう', 'み'],
  '足': ['そく', 'あし'],
  '身': ['しん', 'み'],
  '良': ['りょう', 'よ'],
  '極': ['きょく', 'きわ'],
  '絶': ['ぜつ', 'た'],
  '精': ['せい'],
  '密': ['みつ'],
  '根': ['こん', 'ね'],
  '核': ['かく'],
  '導': ['どう', 'みちび'],
  '指': ['し', 'ゆび'],
  '営': ['えい', 'いとな'],
  '尽': ['じん', 'つ'],
  '専': ['せん', 'もっぱ'],
  '錬': ['れん'],
  '習': ['しゅう', 'なら'],
  '測': ['そく', 'はか'],
  '拠': ['きょ'],
  '委': ['い'],
  '出': ['しゅつ', 'で'],
  '抽': ['ちゅう'],
  '笑': ['しょう', 'わら'],
  '歓': ['かん'],
  '喜': ['き', 'よろこ'],
  '落': ['らく', 'お'],
  '滞': ['たい', 'とどこお'],
  '哲': ['てつ'],
  '存': ['そん', 'あ'],
  '在': ['ざい', 'あ'],
  '探': ['たん', 'さぐ'],
  '問': ['もん', 'と'],
  '憲': ['けん'],
  '常': ['じょう', 'つね'],
  '道': ['どう', 'みち'],
  '則': ['そく'],
  '度': ['ど'],
  '擁': ['よう'],
  '護': ['ご', 'まも'],
  '量': ['りょう'],
  '界': ['かい'],
  '態': ['たい'],
  '系': ['けい'],
  '維': ['い'],
  '髄': ['ずい'],
  '昇': ['しょう', 'のぼ'],
  '済': ['さい', 'す'],
  '策': ['さく'],
  '効': ['こう', 'き'],
  '果': ['か'],
  '検': ['けん', 'しら'],
  '遺': ['い'],
  '疾': ['しつ'],
  '患': ['かん'],
  '治': ['ち', 'なお'],
  '療': ['りょう'],
  '開': ['かい', 'ひら'],
  '際': ['さい', 'きわ'],
  '廷': ['てい'],
  '紛': ['ふん'],
  '争': ['そう', 'あらそ'],
  '促': ['そく', 'うなが'],
  '亡': ['ぼう', 'な'],
  '然': ['ねん', 'しか'],
  '言': ['げん', 'い'],
  '語': ['ご', 'かた'],
  '普': ['ふ'],
  '遍': ['へん'],
  '追': ['つい', 'お'],
  '慮': ['りょ'],
  '粒': ['りゅう', 'つぶ'],
  '互': ['ご', 'たが'],
  '提': ['てい', 'さ'],
  '科': ['か'],
  '思': ['し', 'おも'],
  '金': ['きん', 'かね'],
  '融': ['ゆう'],
  '市': ['し', 'いち'],
  '場': ['じょう', 'ば'],
  '複': ['ふく'],
  '雑': ['ざつ'],
  '起': ['き', 'お'],
  '環': ['かん'],
  '境': ['きょう'],
  '代': ['だい', 'よ'],
  '公': ['こう', 'おおやけ'],
  '技': ['ぎ'],
  '新': ['しん', 'あたら'],
  '家': ['か', 'いえ'],
  '障': ['しょう'],
  '課': ['か'],
  '題': ['だい'],
  '批': ['ひ'],
  '深': ['しん', 'ふか'],
  '層': ['そう'],
  '誉': ['よ', 'ほま'],
  '奥': ['おう', 'おく'],
  '佳': ['か'],
  '受': ['じゅ', 'う'],
  '謙': ['けん'],
  '遜': ['そん'],
  '越': ['えつ', 'こ'],
  '忠': ['ちゅう'],
  '寛': ['かん'],
  '容': ['よう'],
  '勤': ['きん'],
  '勉': ['べん'],
  '創': ['そう', 'つく'],
  '誇': ['こ', 'ほこ'],
  '貢': ['こう'],
  '献': ['けん'],
  '尊': ['そん', 'とうと'],
  '謝': ['しゃ', 'あやま'],
  '努': ['ど', 'つと'],
  '挑': ['ちょう', 'いど'],
  '戦': ['せん', 'たたか'],
  '達': ['たつ', 'たっ'],
  '功': ['こう'],
  '勝': ['しょう', 'か'],
  '利': ['り'],
  '光': ['こう', 'ひか'],
  '秀': ['しゅう', 'ひい'],
  '雅': ['が', 'みやび'],
  '繁': ['はん'],
  '幸': ['こう', 'さいわ'],
  '協': ['きょう'],
  '団': ['だん'],
  '結': ['けつ', 'むす'],
  '致': ['ち', 'いた'],
  '共': ['きょう', 'とも'],
  '同': ['どう', 'おな'],
  '携': ['けい'],
  '秩': ['ちつ'],
  '序': ['じょ'],
  '規': ['き'],
  '律': ['りつ'],
  '礼': ['れい'],
  '儀': ['ぎ'],
  '風': ['ふう', 'かぜ'],
  '洗': ['せん', 'あら'],
  '尚': ['しょう', 'なお'],
  '崇': ['すう', 'あが'],
  '神': ['しん', 'かみ'],
  '聖': ['せい', 'ひじり'],
  '粛': ['しゅく'],
  '荘': ['そう'],
  '壮': ['そう'],
  '雄': ['ゆう', 'お'],
  '偉': ['い', 'えら'],
  '巨': ['きょ'],
  '膨': ['ぼう'],
  '莫': ['ばく'],
  '広': ['こう', 'ひろ'],
  '朽': ['きゅう', 'く'],
  '滅': ['めつ', 'ほろ'],
  '悠': ['ゆう'],
  '古': ['こ', 'ふる'],
  '典': ['てん'],
  '化': ['か', 'ば'],
  '教': ['きょう', 'おし'],
  '養': ['よう', 'やしな'],
  '張': ['ちょう', 'は'],
  '述': ['じゅつ', 'の'],
  '討': ['とう', 'う'],
  '流': ['りゅう', 'なが'],
  '親': ['しん', 'おや'],
  '好': ['こう', 'す'],
  '睦': ['ぼく', 'むつ'],
  '待': ['たい', 'ま'],
  '激': ['げき', 'はげ'],
  '奮': ['ふん'],
  '懸': ['けん', 'か'],
  '剣': ['けん', 'つるぎ'],
  '正': ['せい', 'ただ'],
  '粋': ['すい', 'いき'],
  '楚': ['そ'],
  '白': ['はく', 'しろ'],
  '垢': ['こう', 'あか'],
  '邪': ['じゃ'],
  '天': ['てん', 'あま'],
  '朴': ['ぼく'],
  '瞭': ['りょう'],
  '確': ['かく', 'たし'],
  '烈': ['れつ', 'はげ'],
  '絢': ['けん'],
  '爛': ['らん'],
  '豪': ['ごう'],
  '贅': ['ぜい'],
  '饒': ['じょう'],
  '肥': ['ひ', 'こ'],
  '沃': ['よく'],
  '潤': ['じゅん', 'うるお'],
  '満': ['まん', 'み'],
  '璧': ['へき'],
  '適': ['てき'],
  '緊': ['きん'],
  '迅': ['じん'],
  '捷': ['しょう'],
  '俊': ['しゅん'],
  '繊': ['せん'],
  '詳': ['しょう', 'くわ'],
  '綿': ['めん', 'わた'],
  '丁': ['てい', 'ちょう'],
  '寧': ['ねい'],
  '入': ['にゅう', 'はい'],
  '周': ['しゅう', 'まわ'],
  '到': ['とう'],
  '万': ['まん', 'ばん'],
  '備': ['び', 'そな'],
  '十': ['じゅう', 'とお'],
  '彩': ['さい', 'いろど'],
  '角': ['かく', 'かど'],
  '総': ['そう'],
  '合': ['ごう', 'あ'],
  '包': ['ほう', 'つつ'],
  '括': ['かつ'],
  '般': ['はん'],
  '礎': ['そ'],
  '土': ['ど', 'つち'],
  '台': ['だい', 'うてな'],
  '支': ['し', 'ささ'],
  '柱': ['ちゅう', 'はしら'],
  '管': ['かん'],
  '運': ['うん', 'はこ'],
  '操': ['そう', 'あやつ'],
  '縦': ['じゅう', 'たて'],
  '御': ['ぎょ', 'お'],
  '節': ['せつ', 'ふし'],
  '恒': ['こう'],
  '窮': ['きゅう', 'きわ'],
  '集': ['しゅう', 'あつ'],
  '注': ['ちゅう', 'そそ'],
  '修': ['しゅう', 'おさ'],
  '鍛': ['たん', 'きた'],
  '研': ['けん', 'と'],
  '鑽': ['さん'],
  '訓': ['くん'],
  '体': ['たい', 'からだ'],
  '把': ['は'],
  '握': ['あく', 'にぎ'],
  '透': ['とう', 'す'],
  '看': ['かん', 'み'],
  '破': ['は', 'やぶ'],
  '区': ['く'],
  '差': ['さ'],
  '先': ['せん', 'さき'],
  '類': ['るい'],
  '演': ['えん'],
  '繹': ['えき'],
  '帰': ['き', 'かえ'],
  '納': ['のう', 'おさ'],
  '立': ['りつ', 'た'],
  '由': ['ゆう', 'よし'],
  '誘': ['ゆう', 'さそ'],
  '契': ['けい'],
  '図': ['ず', 'はか'],
  '渇': ['かつ', 'かわ'],
  '切': ['せつ', 'き'],
  '請': ['せい', 'こ'],
  '依': ['い'],
  '託': ['たく'],
  '名': ['めい', 'な'],
  '択': ['たく'],
  '悟': ['ご', 'さと'],
  '腹': ['ふく', 'はら'],
  '胸': ['きょう', 'むね'],
  '肩': ['けん', 'かた'],
  '頭': ['とう', 'あたま'],
  '手': ['しゅ', 'て'],
  '耳': ['じ', 'みみ'],
  '口': ['こう', 'くち'],
  '骨': ['こつ', 'ほね'],
  '血': ['けつ', 'ち'],
  '汗': ['かん', 'あせ'],
  '涙': ['るい', 'なみだ'],
  '顔': ['がん', 'かお'],
  '悦': ['えつ', 'よろこ'],
  '快': ['かい', 'こころよ'],
  '悲': ['ひ', 'かな'],
  '失': ['しつ', 'うしな'],
  '胆': ['たん'],
  '込': ['こ'],
  '沈': ['ちん', 'しず'],
  '停': ['てい', 'と']
}

// 文章テンプレート（漢字に対応）
const sentenceTemplates: { [key: string]: string[] } = {
  // 基本的な形容詞・名詞系
  default: [
    '{kanji}の{reading}は重要な概念です。',
    'この{kanji}の{reading}について考えてみましょう。',
    '{kanji}の{reading}を理解することは大切です。',
    '彼らは{kanji}の{reading}を重視しています。',
    '{kanji}の{reading}が問題の核心です。',
    'これは{kanji}の{reading}に関する事項です。',
    '{kanji}の{reading}は社会的に意義があります。',
    '{kanji}の{reading}について議論されています。',
    'その{kanji}の{reading}は注目に値します。',
    '{kanji}の{reading}を詳しく調べました。'
  ],
  
  // 動詞系
  action: [
    'みんなで{kanji}を{reading}ましょう。',
    '私たちは{kanji}を{reading}する必要があります。',
    '彼は熱心に{kanji}を{reading}しています。',
    '皆が{kanji}を{reading}することを望んでいます。',
    '{kanji}を{reading}する機会を得ました。',
    '専門家が{kanji}を{reading}しました。',
    'きちんと{kanji}を{reading}することが重要です。',
    '慎重に{kanji}を{reading}する必要があります。'
  ],
  
  // 特定の漢字用の特別なテンプレート
  '望': [
    'みんなの[望|のぞみ]が叶うことを祈っています。',
    '将来への[望|のぞみ]を抱いています。',
    'この結果を[望|のぞ]んでいます。',
    '平和を[望|のぞ]む声が高まっています。',
    '成功を[望|のぞ]んで努力しています。'
  ],
  '意': [
    'その[意|い]味について考えました。',
    '彼の[意|い]見を聞きたいです。',
    '[意|い]識を高く持つことが大切です。',
    '[意|い]図を明確にする必要があります。',
    '真の[意|い]味を理解しています。'
  ],
  '見': [
    '専門家の[見|み]解を求めています。',
    'この問題に対する[見|み]方が変わりました。',
    '多角的な[見|み]地から検討しています。',
    '新しい[見|み]識を得ることができました。',
    '[見|み]通しが立たない状況です。'
  ],
  '全': [
    '[全|ぜん]体的な視点で考えます。',
    '[全|まった]く新しいアプローチです。',
    '[全|ぜん]員が参加する予定です。',
    '[全|ぜん]面的に見直しを行います。',
    '[全|ぜん]力で取り組んでいます。'
  ],
  '要': [
    'この点が[要|かなめ]になります。',
    '[要|よう]求に応じて対応します。',
    '[要|よう]点を整理してみましょう。',
    '[要|よう]約すると次のようになります。',
    '[要|よう]素を分析する必要があります。'
  ],
  '品': [
    '高級[品|ひん]を扱っています。',
    '[品|しな]物を大切に扱います。',
    '[品|ひん]質の向上を図ります。',
    '[品|ひん]格のある態度を保ちます。',
    '作[品|ひん]の完成度が高いです。'
  ],
  '心': [
    '[心|こころ]から感謝しています。',
    '[心|しん]理的な影響を考慮します。',
    '[心|こころ]配をおかけしました。',
    '[心|しん]臓の健康を大切にします。',
    '[心|こころ]の準備ができています。'
  ],
  '識': [
    '問題[識|しき]を高める必要があります。',
    '専門的な知[識|しき]が必要です。',
    '常[識|しき]的な判断をします。',
    '見[識|しき]を深めることが大切です。',
    '意[識|しき]改革が求められています。'
  ],
  '力': [
    '[力|ちから]を合わせて頑張ります。',
    '実[力|りょく]を発揮する機会です。',
    '努[力|りょく]の成果が現れています。',
    '能[力|りょく]を向上させたいです。',
    '権[力|りょく]の濫用は許されません。'
  ],
  '理': [
    '[理|り]由を説明してください。',
    '[理|り]論的に考えてみましょう。',
    '心[理|り]学を学んでいます。',
    '[理|り]想的な解決策です。',
    '物[理|り]法則に従います。'
  ],
  '解': [
    '問題を[解|かい]決しました。',
    '誤[解|かい]を招く表現でした。',
    '理[解|かい]が深まりました。',
    '[解|げ]釈の仕方が重要です。',
    '分[解|かい]して調べてみます。'
  ],
  '明': [
    '[明|あか]るい未来を信じています。',
    '[明|めい]確な答えが必要です。',
    '[明|あ]日の予定を確認します。',
    '説[明|めい]書を読んでください。',
    '[明|めい]治時代の文化です。'
  ],
  '情': [
    '[情|じょう]報を収集しています。',
    '[情|じょう]熱的に取り組みます。',
    '[情|じょう]況を把握する必要があります。',
    '感[情|じょう]をコントロールします。',
    '[情|じょう]緒不安定な状態です。'
  ],
  '和': [
    '[和|わ]やかな雰囲気です。',
    '平[和|わ]な世界を願います。',
    '[和|わ]風の建物が美しいです。',
    '調[和|わ]のとれた色彩です。',
    '[和|なご]やかに話し合いました。'
  ],
  '決': [
    '[決|けつ]定事項をお知らせします。',
    '[決|き]して諦めません。',
    '[決|けつ]断力が必要です。',
    '解[決|けつ]策を見つけました。',
    '[決|けつ]意を固めています。'
  ],
  '成': [
    '[成|せい]功を収めました。',
    '完[成|せい]まであと少しです。',
    '[成|な]長を続けています。',
    '[成|せい]果を上げています。',
    '構[成|せい]を見直します。'
  ],
  '大': [
    '[大|だい]学で学んでいます。',
    '[大|おお]きな変化があります。',
    '[大|たい]切な話があります。',
    '[大|だい]規模な計画です。',
    '[大|おお]変な状況でした。'
  ],
  '続': [
    '話の[続|つづ]きを聞かせてください。',
    '[続|ぞく]々と参加者が増えています。',
    '[続|つづ]けることが重要です。',
    '連[続|ぞく]して成功しています。',
    '持[続|ぞく]可能な発展を目指します。'
  ],
  '熱': [
    '[熱|ねつ]心に取り組んでいます。',
    '[熱|あつ]い夏の日でした。',
    '[熱|ねつ]が下がりません。',
    '情[熱|ねつ]を持って働きます。',
    '[熱|ねつ]意ある提案です。'
  ],
  '学': [
    '[学|がく]校で勉強しています。',
    '[学|まな]ぶことが楽しいです。',
    '科[学|がく]技術の発展です。',
    '[学|がく]問を深めたいです。',
    '見[学|がく]に行きました。'
  ],
  '感': [
    '[感|かん]謝の気持ちでいっぱいです。',
    '[感|かん]動的な映画でした。',
    '[感|かん]覚を研ぎ澄まします。',
    '[感|かん]情を表現します。',
    '[感|かん]想を述べてください。'
  ],
  '実': [
    '[実|じつ]際にやってみました。',
    '[実|み]をつけることが大切です。',
    '[実|じつ]用的なアイデアです。',
    '現[実|じつ]を受け入れます。',
    '誠[実|じつ]な人柄です。'
  ],
  '証': [
    '[証|しょう]拠を提示します。',
    '[証|しょう]明書が必要です。',
    '身分[証|しょう]を確認します。',
    '立[証|しょう]することができます。',
    '[証|しょう]人として出廷します。'
  ],
  '素': [
    '[素|そ]晴らしい作品です。',
    '[素|す]直に認めます。',
    '[素|そ]材を厳選しています。',
    '要[素|そ]を分析します。',
    '[素|そ]養を身につけます。'
  ],
  '因': [
    '原[因|いん]を調べています。',
    '[因|いん]果関係を考えます。',
    '遺伝[因|いん]子の研究です。',
    '要[因|いん]を特定しました。',
    '動[因|いん]を探ります。'
  ],
  '調': [
    '[調|ちょう]査結果を発表します。',
    '[調|しら]べてみましょう。',
    '[調|ちょう]整が必要です。',
    '協[調|ちょう]して進めます。',
    '[調|ちょう]子はいかがですか。'
  ],
  '上': [
    '[上|うえ]から見下ろします。',
    '[上|じょう]達しました。',
    'テーブルの[上|うえ]に置きます。',
    '[上|じょう]級者向けの内容です。',
    '向[上|じょう]心を持ちます。'
  ],
  '信': [
    '[信|しん]頼関係を築きます。',
    '[信|しん]念を貫きます。',
    '確[信|しん]を持っています。',
    '[信|しん]用を大切にします。',
    '迷[信|しん]に惑わされません。'
  ],
  '高': [
    '[高|たか]い山に登ります。',
    '[高|こう]級品を扱います。',
    '[高|たか]まる期待感です。',
    '最[高|こう]の結果でした。',
    '[高|こう]等教育を受けます。'
  ]
}

// 次のIDを取得する関数
function getNextId(existingQuestions: Question[]): string {
  const existingIds = existingQuestions
    .map(q => q.id)
    .filter(id => id && id.startsWith('sen-add-'))
    .map(id => parseInt(id!.replace('sen-add-', ''), 10))
    .filter(num => !isNaN(num))
  
  const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0
  return `sen-add-${String(maxId + 1).padStart(3, '0')}`
}

// 問題文を生成する関数
function generateQuestion(kanji: string, count: number, existingQuestions: Question[]): string {
  const readings = kanjiReadings[kanji] || ['']
  const reading = readings[0] || ''
  
  // 特定の漢字用のテンプレートがあるかチェック
  if (sentenceTemplates[kanji]) {
    const templates = sentenceTemplates[kanji]
    const template = templates[count % templates.length]
    return template
  }
  
  // 多様な文章テンプレート
  const generalTemplates = [
    `[${kanji}|${reading}]について詳しく説明します。`,
    `この[${kanji}|${reading}]は非常に重要です。`,
    `[${kanji}|${reading}]を正しく理解しましょう。`,
    `[${kanji}|${reading}]に関する研究が進んでいます。`,
    `[${kanji}|${reading}]の意義を考えてみます。`,
    `[${kanji}|${reading}]について議論しました。`,
    `[${kanji}|${reading}]を専門的に分析します。`,
    `[${kanji}|${reading}]の効果が認められています。`,
    `[${kanji}|${reading}]を活用することにしました。`,
    `[${kanji}|${reading}]の価値を評価しています。`,
    `[${kanji}|${reading}]に対する関心が高まっています。`,
    `[${kanji}|${reading}]を基礎から学習します。`,
    `[${kanji}|${reading}]の特徴を調べました。`,
    `[${kanji}|${reading}]について報告書を作成します。`,
    `[${kanji}|${reading}]を実践的に応用します。`,
    `[${kanji}|${reading}]の概念を明確にします。`,
    `[${kanji}|${reading}]に焦点を当てて検討します。`,
    `[${kanji}|${reading}]を体系的に整理します。`,
    `[${kanji}|${reading}]の可能性を探ります。`,
    `[${kanji}|${reading}]について深く考察します。`
  ]
  
  // 既存の文章と重複しないようにチェック
  const existingSentences = new Set(existingQuestions.map(q => q.sentence))
  let attempts = 0
  let sentence = ''
  
  do {
    const templateIndex = (count + attempts) % generalTemplates.length
    sentence = generalTemplates[templateIndex]
    attempts++
  } while (existingSentences.has(sentence) && attempts < generalTemplates.length * 2)
  
  // それでも重複する場合は、カウンターを追加
  if (existingSentences.has(sentence)) {
    sentence = `[${kanji}|${reading}]について第${count + 1}の観点から検討します。`
  }
  
  return sentence
}

// メイン処理
function main() {
  console.log('🔍 高校漢字の使用頻度分析と追加問題生成')
  console.log('='.repeat(60))

  // 使用頻度が5回未満の漢字を特定
  const underrepresented = findUnderrepresentedKanji()
  
  console.log(`\n📊 使用頻度が5回未満の漢字: ${underrepresented.length}個`)
  console.log('-'.repeat(40))
  
  if (underrepresented.length === 0) {
    console.log('✅ 全ての高校漢字が5回以上使用されています！')
    return
  }

  // 既存の追加問題を読み込み
  const additionalFilePath = join(__dirname, '../src/data/questions/questions-senior-additional.json')
  let existingQuestions: Question[] = []
  
  try {
    const existingData = JSON.parse(readFileSync(additionalFilePath, 'utf8')) as QuestionsFile
    existingQuestions = existingData.questions || []
    console.log(`📝 既存の追加問題: ${existingQuestions.length}個`)
  } catch (error) {
    console.log('📝 新規に追加問題ファイルを作成します')
  }

  // 各漢字について必要な問題数を表示
  console.log('\n📋 不足している漢字と必要な追加問題数:')
  underrepresented.slice(0, 20).forEach(item => {
    console.log(`  ${item.kanji}: ${item.count}回使用 → ${item.needed}問追加必要`)
  })
  
  if (underrepresented.length > 20) {
    console.log(`  ... 他${underrepresented.length - 20}個の漢字`)
  }

  // 新しい問題を生成
  const newQuestions: Question[] = []
  let totalQuestionsNeeded = 0
  
  for (const item of underrepresented) {
    totalQuestionsNeeded += item.needed
    for (let i = 0; i < item.needed; i++) {
      const allExistingQuestions = [...existingQuestions, ...newQuestions]
      const sentence = generateQuestion(item.kanji, i, allExistingQuestions)
      newQuestions.push({
        id: getNextId(allExistingQuestions),
        sentence: sentence
      })
    }
  }

  console.log(`\n🆕 生成する新しい問題数: ${newQuestions.length}個`)
  console.log(`📊 総問題数: ${existingQuestions.length + newQuestions.length}個`)

  // 問題をファイルに保存
  const allQuestions = [...existingQuestions, ...newQuestions]
  const questionsData: QuestionsFile = {
    questions: allQuestions
  }

  // バックアップを作成
  if (existingQuestions.length > 0) {
    const backupPath = additionalFilePath + '.backup'
    writeFileSync(backupPath, JSON.stringify({ questions: existingQuestions }, null, 2))
    console.log(`💾 既存のファイルをバックアップしました: ${backupPath}`)
  }

  // 新しいファイルを保存
  writeFileSync(additionalFilePath, JSON.stringify(questionsData, null, 2))
  console.log(`💾 追加問題を保存しました: ${additionalFilePath}`)

  // 検証を実行（追加ファイルを含めて再読み込み）
  console.log('\n🔄 生成後の検証を実行中...')
  const finalCounts = countSeniorKanjiUsageWithAdditional()
  const stillUnderrepresented = ACTUAL_SENIOR_KANJI.filter(kanji => (finalCounts.get(kanji) || 0) < 5)
  
  if (stillUnderrepresented.length === 0) {
    console.log('✅ 全ての高校漢字が5回以上使用されるようになりました！')
  } else {
    console.log(`⚠️  まだ${stillUnderrepresented.length}個の漢字が5回未満です`)
    console.log('追加の問題生成が必要な可能性があります')
  }

  console.log('\n='.repeat(60))
  console.log('🎉 処理が完了しました！')
  console.log(`📈 改善された漢字数: ${underrepresented.length - stillUnderrepresented.length}個`)
  console.log(`📝 生成された問題数: ${newQuestions.length}個`)
}

// 実行
main()