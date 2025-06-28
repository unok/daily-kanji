import { useState } from 'react'

import type { DifficultyLevel } from '../../services/questionService'
import { DIFFICULTY_DESCRIPTIONS, DIFFICULTY_LABELS } from '../../types/question'

interface MainMenuProps {
  onStart: (difficulty: DifficultyLevel) => void
}

export function MainMenu({ onStart }: MainMenuProps) {
  const [hoveredDifficulty, setHoveredDifficulty] = useState<DifficultyLevel | null>(null)

  const difficulties: DifficultyLevel[] = ['elementary', 'junior']

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'elementary':
        return 'bg-green-500 hover:bg-green-600'
      case 'junior':
        return 'bg-blue-500 hover:bg-blue-600'
    }
  }

  const getDifficultyTextColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'elementary':
        return 'text-green-600'
      case 'junior':
        return 'text-blue-600'
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-lg shadow-2xl p-12 max-w-2xl w-full">
        <h1 className="text-5xl font-bold text-center text-gray-800 mb-4">漢字穴埋め学習</h1>
        <p className="text-center text-gray-600 mb-12 text-lg">難易度を選んで学習を始めましょう</p>

        <div className="space-y-6">
          {difficulties.map((difficulty) => (
            <div key={difficulty} className="relative">
              <button
                type="button"
                onClick={() => onStart(difficulty)}
                onMouseEnter={() => setHoveredDifficulty(difficulty)}
                onMouseLeave={() => setHoveredDifficulty(null)}
                className={`w-full py-6 px-8 text-xl font-bold text-white rounded-lg transition-all duration-200 transform hover:scale-105 ${getDifficultyColor(
                  difficulty
                )} shadow-lg hover:shadow-xl`}
              >
                {DIFFICULTY_LABELS[difficulty]}
              </button>

              {hoveredDifficulty === difficulty && (
                <div className="absolute left-0 right-0 mt-2 p-4 bg-gray-50 rounded-lg shadow-md z-10">
                  <p className={`text-sm ${getDifficultyTextColor(difficulty)}`}>{DIFFICULTY_DESCRIPTIONS[difficulty]}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">学習の特徴</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-3xl mb-2">✏️</div>
              <h3 className="font-semibold mb-1">手書き入力</h3>
              <p>実際に漢字を書いて覚えます</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-3xl mb-2">📝</div>
              <h3 className="font-semibold mb-1">複数入力</h3>
              <p>一度に複数の漢字を練習</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold mb-1">正確な学習</h3>
              <p>間違えたらすぐに確認</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
