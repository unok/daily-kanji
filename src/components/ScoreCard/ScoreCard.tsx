import type { DifficultyLevel } from '../../services/questionService'
import { DIFFICULTY_LABELS } from '../../types/question'

interface ScoreCardProps {
  score: number
  totalQuestions: number
  difficulty: DifficultyLevel
  onContinue: () => void
  onBackToMenu: () => void
}

export function ScoreCard({ score, totalQuestions, difficulty, onContinue, onBackToMenu }: ScoreCardProps) {
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0

  const getGrade = () => {
    if (percentage >= 90) return { grade: 'S', color: 'text-yellow-500', message: '素晴らしい！' }
    if (percentage >= 80) return { grade: 'A', color: 'text-green-500', message: 'よくできました！' }
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-500', message: '良い調子です！' }
    if (percentage >= 60) return { grade: 'C', color: 'text-purple-500', message: 'もう少し頑張りましょう' }
    return { grade: 'D', color: 'text-gray-500', message: '練習を続けましょう' }
  }

  const { grade, color, message } = getGrade()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">学習結果</h2>

        <div className="text-center mb-6">
          <div className={`text-6xl font-bold ${color} mb-2`}>{grade}</div>
          <p className="text-xl text-gray-700">{message}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">正解数</p>
              <p className="text-2xl font-bold text-gray-800">
                {score} / {totalQuestions}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">正答率</p>
              <p className="text-2xl font-bold text-gray-800">{percentage}%</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">難易度</p>
            <p className="text-lg font-semibold text-center text-gray-800">{DIFFICULTY_LABELS[difficulty]}</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onContinue}
            className="w-full py-3 px-6 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
          >
            続けて学習する
          </button>
          <button
            type="button"
            onClick={onBackToMenu}
            className="w-full py-3 px-6 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400 transition-colors"
          >
            メニューに戻る
          </button>
        </div>
      </div>
    </div>
  )
}
