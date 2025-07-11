/**
 * 常用漢字データ
 * 文部科学省の「常用漢字表」（2010年改定）に基づく
 * 全2,136字
 *
 * 配分:
 * - 小学校（教育漢字）: 1,026字
 * - 中学校で新たに学習: 1,110字
 * - 高校: 常用漢字の読み書きを完成させる
 */

// 中学校で新たに学習する漢字（1,110字）
// 注：これらは主に「読み」を学習する漢字
export const MIDDLE_SCHOOL_KANJI = [
  '丈',
  '与',
  '且',
  '丘',
  '丙',
  '串',
  '丹',
  '丼',
  '乏',
  '乙',
  '乞',
  '乾',
  '亀',
  '了',
  '互',
  '亜',
  '享',
  '亭',
  '介',
  '仙',
  '仰',
  '企',
  '伎',
  '伏',
  '伐',
  '伯',
  '伴',
  '伸',
  '伺',
  '但',
  '佳',
  '併',
  '侍',
  '依',
  '侮',
  '侯',
  '侵',
  '侶',
  '促',
  '俊',
  '俗',
  '俸',
  '俺',
  '倒',
  '倣',
  '倫',
  '倹',
  '偉',
  '偏',
  '偵',
  '偶',
  '偽',
  '傍',
  '傑',
  '傘',
  '催',
  '傲',
  '債',
  '傾',
  '僅',
  '僕',
  '僚',
  '僧',
  '儀',
  '儒',
  '償',
  '充',
  '克',
  '免',
  '兼',
  '冒',
  '冗',
  '冠',
  '冥',
  '冶',
  '凄',
  '准',
  '凍',
  '凝',
  '凡',
  '凶',
  '凸',
  '凹',
  '刃',
  '刈',
  '刑',
  '到',
  '刹',
  '刺',
  '削',
  '剖',
  '剛',
  '剝',
  '剣',
  '剤',
  '剰',
  '劣',
  '励',
  '劾',
  '勃',
  '勅',
  '勘',
  '募',
  '勧',
  '勲',
  '勾',
  '匂',
  '匠',
  '匹',
  '匿',
  '升',
  '卑',
  '卓',
  '占',
  '即',
  '却',
  '卸',
  '厄',
  '厘',
  '又',
  '及',
  '双',
  '叔',
  '叙',
  '叫',
  '召',
  '吉',
  '吏',
  '吐',
  '吟',
  '含',
  '吹',
  '呂',
  '呈',
  '呉',
  '呪',
  '咲',
  '咽',
  '哀',
  '哲',
  '哺',
  '唄',
  '唆',
  '唇',
  '唐',
  '唯',
  '唾',
  '啓',
  '喉',
  '喚',
  '喝',
  '喩',
  '喪',
  '喫',
  '嗅',
  '嗣',
  '嘆',
  '嘱',
  '嘲',
  '噴',
  '嚇',
  '囚',
  '圏',
  '坊',
  '坑',
  '坪',
  '垣',
  '埋',
  '執',
  '培',
  '堀',
  '堅',
  '堆',
  '堕',
  '堤',
  '堪',
  '塀',
  '塁',
  '塊',
  '塑',
  '塔',
  '塗',
  '塚',
  '塞',
  '塡',
  '塾',
  '墜',
  '墨',
  '墳',
  '墾',
  '壁',
  '壇',
  '壊',
  '壌',
  '壮',
  '壱',
  '奇',
  '奉',
  '契',
  '奔',
  '奥',
  '奨',
  '奪',
  '奴',
  '如',
  '妃',
  '妄',
  '妊',
  '妖',
  '妙',
  '妥',
  '妨',
  '妬',
  '姓',
  '姫',
  '姻',
  '威',
  '娘',
  '娠',
  '娯',
  '婆',
  '婚',
  '婿',
  '媒',
  '嫁',
  '嫉',
  '嫌',
  '嫡',
  '嬢',
  '孔',
  '孤',
  '宛',
  '宜',
  '宰',
  '宴',
  '宵',
  '寂',
  '寛',
  '寝',
  '寡',
  '寧',
  '審',
  '寮',
  '寿',
  '封',
  '尉',
  '尋',
  '尚',
  '尻',
  '尼',
  '尽',
  '尾',
  '尿',
  '屈',
  '履',
  '屯',
  '岬',
  '岳',
  '峠',
  '峡',
  '峰',
  '崇',
  '崖',
  '崩',
  '嵐',
  '巡',
  '巧',
  '巨',
  '巾',
  '帆',
  '帝',
  '帅',
  '帽',
  '幅',
  '幣',
  '幻',
  '幽',
  '幾',
  '床',
  '庶',
  '庸',
  '廃',
  '廉',
  '廊',
  '廷',
  '弄',
  '弊',
  '弐',
  '弔',
  '弥',
  '弦',
  '弧',
  '弾',
  '彙',
  '彩',
  '彫',
  '彰',
  '影',
  '彼',
  '征',
  '徐',
  '御',
  '循',
  '微',
  '徴',
  '徹',
  '忌',
  '忍',
  '忙',
  '怒',
  '怖',
  '怠',
  '怨',
  '怪',
  '恋',
  '恐',
  '恒',
  '恣',
  '恥',
  '恨',
  '恭',
  '恵',
  '悔',
  '悟',
  '悠',
  '患',
  '悦',
  '悩',
  '悼',
  '惑',
  '惜',
  '惧',
  '惨',
  '惰',
  '愁',
  '愉',
  '愚',
  '慄',
  '慈',
  '慌',
  '慎',
  '慕',
  '慢',
  '慨',
  '慮',
  '慰',
  '慶',
  '憂',
  '憎',
  '憤',
  '憧',
  '憩',
  '憬',
  '憶',
  '憾',
  '懇',
  '懐',
  '懲',
  '懸',
  '戒',
  '戚',
  '戯',
  '戴',
  '戻',
  '房',
  '扇',
  '扉',
  '払',
  '扱',
  '扶',
  '抄',
  '把',
  '抑',
  '抗',
  '抜',
  '択',
  '披',
  '抱',
  '抵',
  '抹',
  '押',
  '抽',
  '拉',
  '拍',
  '拐',
  '拒',
  '拓',
  '拘',
  '拙',
  '拠',
  '括',
  '拭',
  '拳',
  '拶',
  '拷',
  '挑',
  '挟',
  '挨',
  '挫',
  '振',
  '挿',
  '捉',
  '捕',
  '捗',
  '捜',
  '据',
  '捻',
  '掃',
  '掌',
  '排',
  '掘',
  '掛',
  '控',
  '措',
  '掲',
  '描',
  '揚',
  '換',
  '握',
  '援',
  '揺',
  '搬',
  '搭',
  '携',
  '搾',
  '摂',
  '摘',
  '摩',
  '摯',
  '撃',
  '撤',
  '撮',
  '撲',
  '擁',
  '擦',
  '擬',
  '攻',
  '敏',
  '敢',
  '敷',
  '斉',
  '斎',
  '斑',
  '斗',
  '斜',
  '斤',
  '斥',
  '斬',
  '施',
  '旋',
  '既',
  '旦',
  '旨',
  '旬',
  '旺',
  '昆',
  '昇',
  '昧',
  '是',
  '普',
  '晶',
  '暁',
  '暇',
  '暦',
  '暫',
  '曇',
  '曖',
  '更',
  '曹',
  '曽',
  '替',
  '朕',
  '朱',
  '朴',
  '朽',
  '杉',
  '杯',
  '析',
  '枕',
  '枠',
  '枢',
  '枯',
  '架',
  '柄',
  '某',
  '柔',
  '柳',
  '柵',
  '柿',
  '栓',
  '核',
  '栽',
  '桁',
  '桃',
  '桑',
  '桟',
  '梗',
  '棄',
  '棋',
  '棚',
  '棟',
  '棺',
  '椅',
  '椎',
  '楷',
  '楼',
  '概',
  '槽',
  '欄',
  '欧',
  '欺',
  '款',
  '歓',
  '歳',
  '殉',
  '殊',
  '殖',
  '殴',
  '殻',
  '殿',
  '毀',
  '氾',
  '汁',
  '汎',
  '汗',
  '汚',
  '江',
  '汰',
  '沃',
  '沈',
  '沙',
  '没',
  '沢',
  '沸',
  '沼',
  '況',
  '泊',
  '泌',
  '泡',
  '泥',
  '泰',
  '洞',
  '津',
  '洪',
  '浄',
  '浜',
  '浦',
  '浪',
  '浮',
  '浸',
  '涙',
  '涯',
  '涼',
  '淑',
  '淡',
  '淫',
  '添',
  '渇',
  '渉',
  '渋',
  '渓',
  '渡',
  '渦',
  '湧',
  '湾',
  '湿',
  '溝',
  '溶',
  '溺',
  '滅',
  '滑',
  '滝',
  '滞',
  '滴',
  '漂',
  '漆',
  '漏',
  '漠',
  '漫',
  '漬',
  '漸',
  '潜',
  '潤',
  '潰',
  '澄',
  '濁',
  '濃',
  '濫',
  '濯',
  '瀬',
  '炉',
  '炊',
  '炎',
  '為',
  '烈',
  '焦',
  '煎',
  '煙',
  '煩',
  '煮',
  '燥',
  '爆',
  '爪',
  '爵',
  '爽',
  '牙',
  '牲',
  '犠',
  '狂',
  '狙',
  '狩',
  '狭',
  '猛',
  '猟',
  '猫',
  '献',
  '猶',
  '猿',
  '獄',
  '獣',
  '獲',
  '玄',
  '玩',
  '珍',
  '珠',
  '琴',
  '瑠',
  '璃',
  '璧',
  '環',
  '璽',
  '瓦',
  '瓶',
  '甘',
  '甚',
  '甲',
  '畏',
  '畔',
  '畜',
  '畝',
  '畳',
  '畿',
  '疎',
  '疫',
  '疲',
  '疾',
  '症',
  '痕',
  '痘',
  '痢',
  '痩',
  '痴',
  '瘍',
  '療',
  '癒',
  '癖',
  '皆',
  '盆',
  '盗',
  '監',
  '盤',
  '盲',
  '盾',
  '眉',
  '眠',
  '眺',
  '睡',
  '督',
  '睦',
  '瞬',
  '瞭',
  '瞳',
  '矛',
  '矯',
  '砕',
  '砲',
  '硝',
  '硫',
  '硬',
  '碁',
  '碑',
  '磨',
  '礁',
  '礎',
  '祈',
  '祉',
  '祥',
  '禅',
  '禍',
  '秀',
  '租',
  '秩',
  '称',
  '稚',
  '稲',
  '稼',
  '稽',
  '稿',
  '穂',
  '穏',
  '穫',
  '突',
  '窃',
  '窒',
  '窟',
  '窮',
  '窯',
  '竜',
  '端',
  '符',
  '筒',
  '箇',
  '箋',
  '箸',
  '範',
  '篤',
  '簿',
  '籍',
  '籠',
  '粋',
  '粒',
  '粗',
  '粘',
  '粛',
  '粧',
  '糧',
  '糾',
  '紋',
  '紛',
  '紡',
  '索',
  '紫',
  '累',
  '紳',
  '紹',
  '紺',
  '絞',
  '絡',
  '継',
  '維',
  '綱',
  '網',
  '綻',
  '緊',
  '緒',
  '締',
  '緩',
  '緯',
  '緻',
  '縁',
  '縛',
  '縫',
  '繁',
  '繊',
  '繕',
  '繭',
  '繰',
  '缶',
  '罰',
  '罵',
  '罷',
  '羅',
  '羞',
  '羨',
  '翁',
  '翻',
  '翼',
  '耐',
  '耗',
  '聴',
  '肌',
  '肖',
  '肘',
  '肝',
  '股',
  '肢',
  '肩',
  '肪',
  '肯',
  '胆',
  '胎',
  '胞',
  '胴',
  '脂',
  '脅',
  '脇',
  '脊',
  '脚',
  '脱',
  '腎',
  '腐',
  '腕',
  '腫',
  '腰',
  '腺',
  '膚',
  '膜',
  '膝',
  '膨',
  '膳',
  '臆',
  '臭',
  '致',
  '臼',
  '舗',
  '舞',
  '舟',
  '般',
  '舶',
  '舷',
  '艇',
  '艦',
  '艶',
  '芋',
  '芝',
  '芯',
  '芳',
  '苗',
  '苛',
  '茂',
  '茎',
  '荒',
  '荘',
  '菊',
  '菌',
  '菓',
  '華',
  '萎',
  '葛',
  '葬',
  '蓄',
  '蓋',
  '蔑',
  '蔽',
  '薄',
  '薦',
  '薪',
  '薫',
  '藍',
  '藤',
  '藩',
  '藻',
  '虎',
  '虐',
  '虚',
  '虜',
  '虞',
  '虹',
  '蚊',
  '蛇',
  '蛍',
  '蛮',
  '蜂',
  '蜜',
  '融',
  '衝',
  '衡',
  '衰',
  '衷',
  '袋',
  '袖',
  '被',
  '裂',
  '裕',
  '裸',
  '裾',
  '褐',
  '褒',
  '襟',
  '襲',
  '覆',
  '覇',
  '触',
  '訂',
  '訃',
  '託',
  '訟',
  '訴',
  '診',
  '詐',
  '詔',
  '詠',
  '詣',
  '詮',
  '詰',
  '該',
  '詳',
  '誇',
  '誉',
  '誓',
  '誘',
  '誰',
  '請',
  '諦',
  '諧',
  '諭',
  '諮',
  '諾',
  '謀',
  '謁',
  '謄',
  '謎',
  '謙',
  '謡',
  '謹',
  '譜',
  '譲',
  '豚',
  '豪',
  '貌',
  '貞',
  '貢',
  '販',
  '貪',
  '貫',
  '貼',
  '賂',
  '賄',
  '賊',
  '賓',
  '賜',
  '賠',
  '賢',
  '賦',
  '賭',
  '購',
  '贈',
  '赦',
  '赴',
  '超',
  '越',
  '趣',
  '距',
  '跡',
  '跳',
  '践',
  '踊',
  '踏',
  '踪',
  '蹴',
  '躍',
  '軌',
  '軒',
  '軟',
  '軸',
  '較',
  '載',
  '輝',
  '輩',
  '轄',
  '辛',
  '辣',
  '辱',
  '込',
  '迅',
  '迎',
  '迫',
  '迭',
  '逃',
  '透',
  '逐',
  '逓',
  '途',
  '逝',
  '逮',
  '逸',
  '遂',
  '遅',
  '遇',
  '遍',
  '違',
  '遜',
  '遡',
  '遣',
  '遭',
  '遮',
  '遵',
  '遷',
  '避',
  '還',
  '那',
  '邦',
  '邪',
  '邸',
  '郊',
  '郎',
  '郭',
  '酌',
  '酎',
  '酔',
  '酢',
  '酪',
  '酬',
  '酵',
  '酷',
  '醒',
  '醜',
  '醸',
  '采',
  '釈',
  '釜',
  '釣',
  '鈍',
  '鈴',
  '鉛',
  '鉢',
  '銃',
  '銘',
  '鋭',
  '鋳',
  '錠',
  '錦',
  '錬',
  '錮',
  '錯',
  '鍋',
  '鍛',
  '鍵',
  '鎌',
  '鎖',
  '鎮',
  '鐘',
  '鑑',
  '閑',
  '閥',
  '閲',
  '闇',
  '闘',
  '阻',
  '附',
  '陣',
  '陥',
  '陪',
  '陰',
  '陳',
  '陵',
  '陶',
  '隅',
  '隆',
  '随',
  '隔',
  '隙',
  '隠',
  '隣',
  '隷',
  '隻',
  '雄',
  '雅',
  '雇',
  '雌',
  '離',
  '雰',
  '零',
  '雷',
  '需',
  '震',
  '霊',
  '霜',
  '霧',
  '露',
  '靴',
  '韓',
  '韻',
  '響',
  '頃',
  '項',
  '須',
  '頑',
  '頒',
  '頓',
  '頰',
  '頻',
  '頼',
  '顎',
  '顕',
  '顧',
  '飢',
  '飽',
  '飾',
  '餅',
  '餌',
  '餓',
  '駄',
  '駆',
  '駐',
  '駒',
  '騎',
  '騒',
  '騰',
  '驚',
  '骸',
  '髄',
  '髪',
  '鬱',
  '鬼',
  '魂',
  '魅',
  '魔',
  '鮮',
  '鯨',
  '鶏',
  '鶴',
  '麓',
  '麗',
  '麺',
  '麻',
  '黙',
  '鼓',
  '𠮟',
]

// 学年別の目安（文部科学省の指針に基づく）
export const MIDDLE_SCHOOL_GRADE_DISTRIBUTION = {
  grade7: 350, // 中学1年: 300-400字
  grade8: 400, // 中学2年: 350-450字
  grade9: 359, // 中学3年: 残り
}

// エクスポート用の関数
export const getMiddleSchoolKanji = (): string[] => {
  return MIDDLE_SCHOOL_KANJI
}

// 以前のエクスポート名との互換性のため
export const ACTUAL_JUNIOR_KANJI = MIDDLE_SCHOOL_KANJI

// 統計情報
export const JOUYOU_KANJI_TOTAL = 2136
export const ELEMENTARY_KANJI_TOTAL = 1026
export const MIDDLE_SCHOOL_KANJI_TOTAL = 1110
