import { useCallback, useEffect, useState } from 'react'

import type { Question as QuestionType } from '../../atoms/gameAtoms'
import { useKanjiRecognition } from '../../hooks/useKanjiRecognition'
import { WritingCanvas } from '../WritingCanvas'

interface QuestionProps {
  question: QuestionType
  onAnswer: (answer: string) => void
}

export function Question({ question, onAnswer }: QuestionProps) {
  const [canvasId, setCanvasId] = useState<string>('')
  const { recognizeFromCanvas, recognizedCharacter, isLoading: isRecognizing, error } = useKanjiRecognition()

  const handleCanvasReady = useCallback((id: string) => {
    setCanvasId(id)
  }, [])

  const handleImageCapture = () => {
    if (canvasId) {
      recognizeFromCanvas(canvasId)
    }
  }

  // recognizedCharacterが変更されたときにconsoleに出力（デバッグ用）
  useEffect(() => {
    if (recognizedCharacter) {
    }
  }, [recognizedCharacter])

  // 候補ボタンのクリックイベントを監視
  useEffect(() => {
    const handleCandidateClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'BUTTON' && target.parentElement?.id === 'kanji-candidates') {
        const character = target.textContent
        if (character) {
          onAnswer(character)
        }
      }
    }

    document.addEventListener('click', handleCandidateClick)
    return () => {
      document.removeEventListener('click', handleCandidateClick)
    }
  }, [onAnswer])

  const handleSubmit = () => {
    if (recognizedCharacter) {
      onAnswer(recognizedCharacter)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 text-center">{question.sentence}</h2>
      </div>

      <WritingCanvas onImageCapture={handleImageCapture} onCanvasReady={handleCanvasReady} />

      {error && <div className="mt-4 text-center text-red-600">{error}</div>}

      {recognizedCharacter && (
        <div className="mt-4 text-center">
          <p className="text-lg mb-2">認識結果: {recognizedCharacter}</p>
          <button type="button" onClick={handleSubmit} className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600" disabled={isRecognizing}>
            回答する
          </button>
        </div>
      )}

      {isRecognizing && <div className="mt-4 text-center text-gray-600">認識中...</div>}
    </div>
  )
}
