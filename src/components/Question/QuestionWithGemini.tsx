import { useCallback, useEffect, useState } from 'react'

import type { Question as QuestionType } from '../../atoms/gameAtoms'
import { useGeminiNano } from '../../hooks/useGeminiNano'
import { useKanjiRecognition } from '../../hooks/useKanjiRecognition'
import { WritingCanvas } from '../WritingCanvas'

interface QuestionProps {
  question: QuestionType
  onAnswer: (answer: string) => void
}

export function Question({ question, onAnswer }: QuestionProps) {
  const [canvasId, setCanvasId] = useState<string>('')
  const [useGemini, setUseGemini] = useState(false)
  const [recognizedChar, setRecognizedChar] = useState<string | null>(null)

  const { recognizeFromCanvas: recognizeWithKanjiCanvas, recognizedCharacter, isLoading: isRecognizingKanji, error: kanjiError } = useKanjiRecognition()

  const { isAvailable: geminiAvailable, recognizeFromCanvas: recognizeWithGemini, isLoading: isRecognizingGemini, error: geminiError } = useGeminiNano()

  const handleCanvasReady = useCallback((id: string) => {
    setCanvasId(id)
  }, [])

  const handleImageCapture = async () => {
    if (canvasId) {
      if (useGemini && geminiAvailable) {
        const result = await recognizeWithGemini(canvasId)
        if (result) {
          setRecognizedChar(result)
        }
      } else {
        recognizeWithKanjiCanvas(canvasId)
      }
    }
  }

  // recognizedCharacterが変更されたときにconsoleに出力（デバッグ用）
  useEffect(() => {
    if (recognizedCharacter) {
      setRecognizedChar(recognizedCharacter)
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
    if (recognizedChar) {
      onAnswer(recognizedChar)
    }
  }

  const isRecognizing = isRecognizingKanji || isRecognizingGemini
  const error = useGemini ? geminiError : kanjiError

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 text-center">{question.sentence}</h2>

        {geminiAvailable && (
          <div className="text-center mb-4">
            <button type="button" onClick={() => setUseGemini(!useGemini)} className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
              {useGemini ? 'Gemini Nano使用中' : 'KanjiCanvas使用中'}
            </button>
          </div>
        )}
      </div>

      <WritingCanvas onImageCapture={handleImageCapture} onCanvasReady={handleCanvasReady} />

      {error && <div className="mt-4 text-center text-red-600">{error}</div>}

      {recognizedChar && (
        <div className="mt-4 text-center">
          <p className="text-lg mb-2">認識結果: {recognizedChar}</p>
          <button type="button" onClick={handleSubmit} className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600" disabled={isRecognizing}>
            回答する
          </button>
        </div>
      )}

      {isRecognizing && <div className="mt-4 text-center text-gray-600">認識中...</div>}
    </div>
  )
}
