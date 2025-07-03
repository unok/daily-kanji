/**
 * アプリケーション全体で使用する定数
 */

// 学年定義
export const GRADES = [
  { key: '1', name: '小学1年生', idPrefix: 'e1', filePrefix: 'questions-elementary1-part' },
  { key: '2', name: '小学2年生', idPrefix: 'e2', filePrefix: 'questions-elementary2-part' },
  { key: '3', name: '小学3年生', idPrefix: 'e3', filePrefix: 'questions-elementary3-part' },
  { key: '4', name: '小学4年生', idPrefix: 'e4', filePrefix: 'questions-elementary4-part' },
  { key: '5', name: '小学5年生', idPrefix: 'e5', filePrefix: 'questions-elementary5-part' },
  { key: '6', name: '小学6年生', idPrefix: 'e6', filePrefix: 'questions-elementary6-part' },
  { key: 'junior', name: '中学校', idPrefix: 'jun', filePrefix: 'questions-junior-part' },
] as const

export type GradeKey = (typeof GRADES)[number]['key']

// 学年番号への変換
export function getGradeNumber(gradeKey: GradeKey): number {
  return gradeKey === 'junior' ? 7 : Number.parseInt(gradeKey, 10)
}

// ファイルパターン
export const QUESTION_FILE_PATTERN = /^questions-.*\.json$/
