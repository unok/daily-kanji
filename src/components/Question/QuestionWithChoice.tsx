import { useCallback, useState } from 'react'

import type { Question as QuestionType } from '../../atoms/gameAtoms'
import { WritingCanvas } from '../WritingCanvas'

interface QuestionProps {
  question: QuestionType
  onAnswer: (answer: string) => void
}

export function Question({ question, onAnswer }: QuestionProps) {
  const [mode, setMode] = useState<'writing' | 'choice'>('choice')
  const [canvasId, setCanvasId] = useState<string>('')
  const [writingCount, setWritingCount] = useState(0)
  const [showResult, setShowResult] = useState(false)

  const handleCanvasReady = useCallback((id: string) => {
    setCanvasId(id)
  }, [])

  // 選択肢モード：正解を見て練習するかどうか選ぶ
  const handleChoiceMode = (needsPractice: boolean) => {
    if (needsPractice) {
      setMode('writing')
    } else {
      // 練習不要の場合は正解として次へ
      onAnswer(question.answer)
    }
  }

  // 手書き練習モード
  const handleWritingComplete = () => {
    setWritingCount(writingCount + 1)

    if (writingCount >= 2) {
      // 3回練習したら完了
      setShowResult(true)
    } else {
      // キャンバスをクリア
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
    }
  }

  const handleSubmit = () => {
    onAnswer(question.answer)
  }

  // 問題文をパースして、ふりがな付きの空欄を表示
  const renderQuestionWithFurigana = () => {
    const sentence = question.sentence
    const match = sentence.match(/(.*)〔(.*)〕(.*)/)

    if (match) {
      const [, before, blank, after] = match
      const blankLength = blank.length

      return (
        <div className="text-2xl font-bold text-center leading-loose">
          <span>{before}</span>
          <span className="inline-block relative mx-1 align-bottom">
            <span className="inline-block border-b-2 border-gray-600 px-2 pb-1" style={{ minWidth: `${blankLength * 1.5}em` }}>
              {Array(blankLength).fill('　').join('')}
            </span>
          </span>
          <span>{after}</span>
        </div>
      )
    }

    return <div className="text-2xl font-bold text-center">{sentence}</div>
  }

  if (mode === 'choice') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="mb-8 mt-4">{renderQuestionWithFurigana()}</div>

        <div className="mb-6 text-center">
          <p className="text-lg font-bold text-gray-700 mb-2">
            答え: <span className="text-3xl text-blue-600">{question.answer}</span>
          </p>
          <p className="text-sm text-gray-600">この漢字を書けますか？</p>
        </div>

        <div className="flex gap-4 justify-center">
          <button type="button" onClick={() => handleChoiceMode(false)} className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
            書ける！
          </button>
          <button type="button" onClick={() => handleChoiceMode(true)} className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            練習する
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8 mt-4">{renderQuestionWithFurigana()}</div>

      <div className="mb-4 text-center">
        <p className="text-lg font-bold text-gray-700">
          答え: <span className="text-3xl text-blue-600">{question.answer}</span>
        </p>
        <p className="text-sm text-gray-600 mt-2">上の漢字を見ながら3回練習しましょう（{writingCount + 1}/3回）</p>
      </div>

      <WritingCanvas onImageCapture={handleWritingComplete} onCanvasReady={handleCanvasReady} key={`canvas-${question.id}-${writingCount}`} />

      {showResult && (
        <div className="mt-6 text-center">
          <p className="text-xl font-bold text-green-600 mb-4">よく練習できました！</p>
          <button type="button" onClick={handleSubmit} className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
            次の問題へ
          </button>
        </div>
      )}
    </div>
  )
}
