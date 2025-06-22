// 新しい問題フォーマットの型定義

export interface KanjiInput {
  kanji: string // 入力すべき漢字
  reading: string // 読み方
  position: number // 文章内の位置（何文字目か）
  index: number // 入力欄のインデックス（0から始まる）
  groupId?: number // 同じグループの入力欄（例：「病気」の「病」と「気」）
  isGroupStart?: boolean // グループの最初かどうか
  groupSize?: number // グループのサイズ
}

export interface QuestionData {
  id: string
  originalSentence: string // 元の文章（[漢字|読み]形式を含む）
  displaySentence: string // 表示用の文章（入力欄は〔　〕で表現）
  inputs: KanjiInput[] // 入力欄の情報
  difficulty: 'elementary' | 'junior' | 'senior' | 'elementary1' | 'elementary2' | 'elementary3' | 'elementary4' | 'elementary5' | 'elementary6' // 小学校/中学校/高校
  category?: string // カテゴリー（オプション）
}

// パース結果の型
export interface ParseResult {
  displaySentence: string
  inputs: KanjiInput[]
}

// 難易度の日本語表記
export const DIFFICULTY_LABELS = {
  elementary: '小学校卒業レベル',
  junior: '中学校卒業レベル',
  senior: '高校卒業レベル',
  elementary1: '小学1年生',
  elementary2: '小学2年生',
  elementary3: '小学3年生',
  elementary4: '小学4年生',
  elementary5: '小学5年生',
  elementary6: '小学6年生',
} as const

// 難易度の説明
export const DIFFICULTY_DESCRIPTIONS = {
  elementary: '小学校で習う漢字を中心とした問題です',
  junior: '中学校で習う漢字を含む、やや難しい問題です',
  senior: '高校レベルの漢字を含む、難しい問題です',
  elementary1: '小学1年生で習う漢字の問題です',
  elementary2: '小学2年生で習う漢字の問題です',
  elementary3: '小学3年生で習う漢字の問題です',
  elementary4: '小学4年生で習う漢字の問題です',
  elementary5: '小学5年生で習う漢字の問題です',
  elementary6: '小学6年生で習う漢字の問題です',
} as const

// 後方互換性のため QuestionInput 型をエクスポート
export type QuestionInput = KanjiInput
