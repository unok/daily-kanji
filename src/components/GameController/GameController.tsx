import { useState } from 'react'

import type { DifficultyLevel } from '../../services/questionService'
import { KanjiFillBlankNew } from '../KanjiFillBlankNew'
import { MainMenu } from '../MainMenu'
import { ScoreCard } from '../ScoreCard'

export function GameController() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'score'>('menu')
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('elementary')
  const [sessionScore, setSessionScore] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(0)

  const handleStart = (difficulty: DifficultyLevel) => {
    setSelectedDifficulty(difficulty)
    setGameState('playing')
  }

  const handleBackToMenu = () => {
    setGameState('menu')
  }

  const handleSessionComplete = (score: number, total: number) => {
    setSessionScore(score)
    setSessionTotal(total)
    setGameState('score')
  }

  const handleContinue = () => {
    setGameState('playing')
  }

  if (gameState === 'menu') {
    return <MainMenu onStart={handleStart} />
  }

  if (gameState === 'score') {
    return (
      <ScoreCard
        score={sessionScore}
        totalQuestions={sessionTotal}
        difficulty={selectedDifficulty}
        onContinue={handleContinue}
        onBackToMenu={handleBackToMenu}
      />
    )
  }

  return (
    <div>
      <KanjiFillBlankNew difficulty={selectedDifficulty} onSessionComplete={handleSessionComplete} />
      <div className="fixed top-4 left-4">
        <button type="button" onClick={handleBackToMenu} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-lg">
          ← メニューに戻る
        </button>
      </div>
    </div>
  )
}
