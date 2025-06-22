import { useCallback, useState } from 'react'

import type { Question as QuestionType } from '../../atoms/gameAtoms'
import { WritingCanvas } from '../WritingCanvas'

interface QuestionProps {
  question: QuestionType
  onAnswer: (answer: string) => void
}

export function Question({ question, onAnswer }: QuestionProps) {
  const [canvasId, setCanvasId] = useState<string>('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [attempts, setAttempts] = useState(0)

  const handleCanvasReady = useCallback((id: string) => {
    setCanvasId(id)
  }, [])

  // ストロークの特徴を簡易的に比較
  const compareStrokes = (canvas: HTMLCanvasElement, _targetChar: string): boolean => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return false

    // キャンバスの画像データを取得
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // 黒いピクセルの数と分布を確認
    let blackPixels = 0
    let minX = canvas.width
    let maxX = 0
    let minY = canvas.height
    let maxY = 0

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]

        // 黒いピクセルかどうか
        if (r < 128 && g < 128 && b < 128) {
          blackPixels++
          minX = Math.min(minX, x)
          maxX = Math.max(maxX, x)
          minY = Math.min(minY, y)
          maxY = Math.max(maxY, y)
        }
      }
    }

    // 文字のサイズをチェック（キャンバスの50%以上を使っているか）
    const charWidth = maxX - minX
    const charHeight = maxY - minY
    const sizeRatio = Math.min(charWidth / canvas.width, charHeight / canvas.height)

    // 最低限のストロークがあるか（黒いピクセルが一定以上）
    const strokeRatio = blackPixels / (canvas.width * canvas.height)

    return sizeRatio > 0.3 && strokeRatio > 0.01
  }

  const handleImageCapture = () => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvas) return

    // 簡易的な検証
    const hasValidStrokes = compareStrokes(canvas, question.answer)

    if (!hasValidStrokes) {
      alert('もう少し大きく、はっきりと書いてください')
      return
    }

    // 練習モード：一定回数書いたら正解とする
    setAttempts(attempts + 1)

    if (attempts >= 2) {
      // 3回書いたら正解
      setIsCorrect(true)
      setShowResult(true)
    } else {
      alert(`よく書けています！あと${3 - attempts - 1}回練習しましょう`)
      // キャンバスをクリア
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  const handleSubmit = () => {
    onAnswer(question.answer) // 練習が完了したら正解として処理
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

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8 mt-4">{renderQuestionWithFurigana()}</div>

      <div className="mb-4 text-center">
        <p className="text-lg font-bold text-gray-700">
          答え: <span className="text-3xl text-blue-600">{question.answer}</span>
        </p>
        <p className="text-sm text-gray-600 mt-2">上の漢字を見ながら3回練習しましょう（{attempts}/3回）</p>
      </div>

      <WritingCanvas onImageCapture={handleImageCapture} onCanvasReady={handleCanvasReady} key={`canvas-${question.id}-${attempts}`} />

      {showResult && isCorrect && (
        <div className="mt-6 text-center">
          <p className="text-xl font-bold text-green-600 mb-4">よくできました！</p>
          <button type="button" onClick={handleSubmit} className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
            次の問題へ
          </button>
        </div>
      )}
    </div>
  )
}
