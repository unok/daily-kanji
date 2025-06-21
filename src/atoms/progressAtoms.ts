import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export interface DailyProgress {
  date: string
  questionsCompleted: number
  correctCount: number
  incorrectCount: number
  practiceCompleted: boolean
}

export interface ProgressData {
  [date: string]: DailyProgress
}

// LocalStorageに保存される進捗データ
export const dailyProgressAtom = atomWithStorage<ProgressData>('dailyProgress', {})

// 今日の進捗を取得
export const todayProgressAtom = atom((get) => {
  const progress = get(dailyProgressAtom)
  const today = new Date().toISOString().split('T')[0]
  return progress[today] || null
})

// 連続学習日数を計算
export const streakAtom = atom((get) => {
  const progress = get(dailyProgressAtom)
  const dates = Object.keys(progress).sort().reverse()

  if (dates.length === 0) return 0

  let streak = 0
  const today = new Date()

  for (let i = 0; i < dates.length; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - i)
    const dateStr = checkDate.toISOString().split('T')[0]

    if (progress[dateStr] && progress[dateStr].questionsCompleted > 0) {
      streak++
    } else if (i > 0) {
      // 昨日以前で記録がない場合は終了
      break
    }
  }

  return streak
})

// 統計情報
export const statsAtom = atom((get) => {
  const progress = get(dailyProgressAtom)
  const values = Object.values(progress)

  const totalQuestions = values.reduce((sum, p) => sum + p.questionsCompleted, 0)
  const totalCorrect = values.reduce((sum, p) => sum + p.correctCount, 0)
  const totalIncorrect = values.reduce((sum, p) => sum + p.incorrectCount, 0)

  return {
    totalDays: values.length,
    totalQuestions,
    totalCorrect,
    totalIncorrect,
    accuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
  }
})
