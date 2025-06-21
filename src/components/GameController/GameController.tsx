import { useState } from 'react'

import type { DifficultyLevel } from '../../services/questionService'
import { KanjiFillBlankNew } from '../KanjiFillBlankNew'
import { MainMenu } from '../MainMenu'

export function GameController() {
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu')
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('elementary')

  const handleStart = (difficulty: DifficultyLevel) => {
    setSelectedDifficulty(difficulty)
    setGameState('playing')
  }

  const handleBackToMenu = () => {
    setGameState('menu')
  }

  if (gameState === 'menu') {
    return <MainMenu onStart={handleStart} />
  }

  return (
    <div>
      <KanjiFillBlankNew difficulty={selectedDifficulty} />
      <div className="fixed top-4 left-4">
        <button type="button" onClick={handleBackToMenu} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-lg">
          ← メニューに戻る
        </button>
      </div>
    </div>
  )
}
