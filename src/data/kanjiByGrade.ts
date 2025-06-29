import { EDUCATION_KANJI } from './kanji-lists/education-kanji'
import { ACTUAL_JUNIOR_KANJI } from './kanji-lists/jouyou-kanji'

// 学年別漢字リスト
export const KANJI_BY_GRADE: Record<string, string[]> = {
  小学1年: EDUCATION_KANJI[1],
  小学2年: EDUCATION_KANJI[2],
  小学3年: EDUCATION_KANJI[3],
  小学4年: EDUCATION_KANJI[4],
  小学5年: EDUCATION_KANJI[5],
  小学6年: EDUCATION_KANJI[6],
  中学校: ACTUAL_JUNIOR_KANJI,
  高校: [], // 高校は常用漢字の読み書きを完成させるため、新規漢字はなし
}
