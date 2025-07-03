import { type MouseEvent, type TouchEvent, useCallback, useEffect, useRef, useState } from 'react'

import { type BoundingBox, drawNormalizedImage, drawReferenceKanjiWithFont, getBoundingBox } from '../../utils/kanjiRecognition'

interface QuestionData {
  sentence: string
  kanji: string
  reading: string
}

const questionData: QuestionData[] = [
  {
    sentence: '今日は{kanji}曜日です。',
    kanji: '月',
    reading: 'げつ',
  },
  {
    sentence: '{kanji}が東から昇る。',
    kanji: '日',
    reading: 'ひ',
  },
  {
    sentence: '公園の{kanji}陰で休む。',
    kanji: '木',
    reading: 'き',
  },
  {
    sentence: '冷たい{kanji}を飲む。',
    kanji: '水',
    reading: 'みず',
  },
  {
    sentence: '富士{kanji}に登る。',
    kanji: '山',
    reading: 'さん',
  },
  {
    sentence: '国会{kanji}事堂を見学する。',
    kanji: '議',
    reading: 'ぎ',
  },
  {
    sentence: '環境を{kanji}る活動。',
    kanji: '護',
    reading: 'まも',
  },
  {
    sentence: '{kanji}雑な問題を解く。',
    kanji: '複',
    reading: 'ふく',
  },
  {
    sentence: '自動車を{kanji}転する。',
    kanji: '運',
    reading: 'うん',
  },
  {
    sentence: '図書{kanji}で勉強する。',
    kanji: '館',
    reading: 'かん',
  },
]

const fontList = [
  '"Hiragino Sans", "Meiryo", sans-serif',
  '"Hiragino Mincho", "MS Mincho", serif',
  '"Klee", "Comic Sans MS", cursive',
  '"Yu Gothic", "Meiryo", sans-serif',
  'serif',
]

export function KanjiFillBlank() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null)
  const [attemptCount, setAttemptCount] = useState(0)
  const [score, setScore] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState<{
    userBBox: { width: number; height: number }
    allResults: Array<{ font: string; f1Score: number; precision: number; recall: number; isBest: boolean }>
  } | null>(null)
  const [isGiveUp, setIsGiveUp] = useState(false)

  useEffect(() => {
    if (currentQuestion) {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.lineWidth = 8
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#000'
      setContext(ctx)
    }
  }, [currentQuestion])

  const loadRandomQuestion = useCallback(() => {
    const question = questionData[Math.floor(Math.random() * questionData.length)]
    setCurrentQuestion(question)
    setTotalQuestions((prev) => prev + 1)
    setAttemptCount(0)
    setShowResult(false)
    setDebugInfo(null)
  }, [])

  useEffect(() => {
    loadRandomQuestion()
  }, [loadRandomQuestion])

  const startDrawing = (x: number, y: number) => {
    if (!(context && canvasRef.current)) return

    const rect = canvasRef.current.getBoundingClientRect()
    setIsDrawing(true)
    context.beginPath()
    context.moveTo(x - rect.left, y - rect.top)
  }

  const draw = (x: number, y: number) => {
    if (!(isDrawing && context && canvasRef.current)) return

    const rect = canvasRef.current.getBoundingClientRect()
    context.lineTo(x - rect.left, y - rect.top)
    context.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    startDrawing(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    draw(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    stopDrawing()
  }

  const handleTouchStart = (e: TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    startDrawing(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    draw(touch.clientX, touch.clientY)
  }

  const clearCanvas = () => {
    if (!(context && canvasRef.current)) return
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  }

  const calculateSimilarityWithFont = (_userImageData: ImageData, userBBox: BoundingBox, fontFamily: string) => {
    if (!(currentQuestion && canvasRef.current)) return { f1Score: 0, precision: 0, recall: 0, matchingPixels: 0, userPixels: 0, refPixels: 0 }

    const refCanvas = drawReferenceKanjiWithFont(currentQuestion.kanji, fontFamily)
    const refCtx = refCanvas.getContext('2d')
    if (!refCtx) return { f1Score: 0, precision: 0, recall: 0, matchingPixels: 0, userPixels: 0, refPixels: 0 }

    const refImageData = refCtx.getImageData(0, 0, refCanvas.width, refCanvas.height)
    const refBBox = getBoundingBox(refImageData)

    const normalizedSize = 100
    const userNormCanvas = document.createElement('canvas')
    const refNormCanvas = document.createElement('canvas')
    userNormCanvas.width = userNormCanvas.height = normalizedSize
    refNormCanvas.width = refNormCanvas.height = normalizedSize

    const normalizedUserData = drawNormalizedImage(canvasRef.current, userNormCanvas, userBBox, 0.8)
    const normalizedRefData = drawNormalizedImage(refCanvas, refNormCanvas, refBBox, 0.8)

    if (!(normalizedUserData && normalizedRefData)) {
      return { f1Score: 0, precision: 0, recall: 0, matchingPixels: 0, userPixels: 0, refPixels: 0 }
    }

    const userData = normalizedUserData.data
    const refData = normalizedRefData.data

    let matchingPixels = 0
    let userPixels = 0
    let refPixels = 0

    for (let i = 0; i < userData.length; i += 4) {
      const userAlpha = userData[i + 3]
      const refAlpha = refData[i + 3]

      if (userAlpha > 50 && refAlpha > 50) {
        matchingPixels++
      }

      if (userAlpha > 50) userPixels++
      if (refAlpha > 50) refPixels++
    }

    if (userPixels === 0) return { f1Score: 0, precision: 0, recall: 0, matchingPixels: 0, userPixels: 0, refPixels: 0 }

    const precision = matchingPixels / userPixels
    const recall = matchingPixels / refPixels
    const f1Score = (2 * (precision * recall)) / (precision + recall)

    return { f1Score: f1Score || 0, precision, recall, matchingPixels, userPixels, refPixels }
  }

  const calculateSimilarity = () => {
    if (!(context && canvasRef.current)) return 0

    const userImageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
    const userBBox = getBoundingBox(userImageData)

    let bestScore = 0
    let bestFontIndex = 0
    const allResults: Array<{ font: string } & ReturnType<typeof calculateSimilarityWithFont>> = []

    fontList.forEach((font, index) => {
      const result = calculateSimilarityWithFont(userImageData, userBBox, font)
      allResults.push({
        font: font.split(',')[0].replace(/"/g, ''),
        ...result,
      })

      if (result.f1Score > bestScore) {
        bestScore = result.f1Score
        bestFontIndex = index
      }
    })

    if (showDebug) {
      const debugData = {
        userBBox,
        allResults: allResults.map((result, index) => ({
          ...result,
          isBest: index === bestFontIndex,
        })),
      }
      setDebugInfo(debugData)
    }

    return bestScore
  }

  const checkAnswer = () => {
    setAttemptCount((prev) => prev + 1)

    const similarity = calculateSimilarity()
    const threshold = 0.45

    setShowResult(true)

    if (similarity >= threshold) {
      setIsCorrect(true)
      if (attemptCount === 0) {
        setScore((prev) => prev + 1)
      }
    } else {
      setIsCorrect(false)
    }
  }

  const retry = () => {
    clearCanvas()
    setShowResult(false)
    setIsCorrect(false)
    setIsGiveUp(false)
  }

  const giveUp = () => {
    setShowResult(true)
    setIsCorrect(false)
    setIsGiveUp(true)
  }

  const nextQuestion = () => {
    clearCanvas()
    setShowResult(false)
    setIsCorrect(false)
    setAttemptCount(0)
    setIsGiveUp(false)
    loadRandomQuestion()
  }

  if (!currentQuestion) {
    return <div>Loading...</div>
  }

  const parts = currentQuestion.sentence.split('{kanji}')

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-5">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">漢字穴埋め学習</h1>

        <div className="bg-gray-50 p-8 rounded-lg mb-8 text-center">
          <div className="text-3xl text-gray-800 leading-relaxed flex items-center justify-center flex-wrap gap-2">
            {parts[0] && <span>{parts[0]}</span>}
            <div className="inline-block w-20 h-20 border-4 border-blue-500 rounded-lg bg-white relative mx-1 flex items-center justify-center">
              {showResult && isCorrect && <span className="text-5xl font-bold text-green-500">{currentQuestion.kanji}</span>}
              {showResult && !isCorrect && isGiveUp && <span className="text-5xl font-bold text-red-500">{currentQuestion.kanji}</span>}
              {!showResult && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-base text-gray-600 bg-gray-50 px-2 py-1 rounded whitespace-nowrap">
                  ({currentQuestion.reading})
                </div>
              )}
            </div>
            {parts[1] && <span>{parts[1]}</span>}
          </div>
        </div>

        <div className="text-center mb-5">
          <div className="text-lg text-gray-600 mb-4">ここに漢字を書いてください</div>
          <div className="inline-block relative">
            <canvas
              ref={canvasRef}
              width={250}
              height={250}
              className="border-4 border-gray-800 rounded-lg bg-white cursor-crosshair"
              tabIndex={0}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseOut={stopDrawing}
              onBlur={stopDrawing}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                }
              }}
              onKeyUp={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                }
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={stopDrawing}
            />
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <title>Canvas grid lines</title>
              <line x1="125" y1="0" x2="125" y2="250" stroke="#e0e0e0" strokeWidth="1" strokeDasharray="3, 3" />
              <line x1="0" y1="125" x2="250" y2="125" stroke="#e0e0e0" strokeWidth="1" strokeDasharray="3, 3" />
            </svg>
          </div>
        </div>

        <div className="flex gap-3 justify-center mt-5">
          {!showResult && (
            <>
              <button
                type="button"
                onClick={clearCanvas}
                className="px-6 py-3 text-base font-bold bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                消す
              </button>
              <button
                type="button"
                onClick={checkAnswer}
                className="px-6 py-3 text-base font-bold bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                答え合わせ
              </button>
            </>
          )}
          {showResult && isCorrect && (
            <button
              type="button"
              onClick={nextQuestion}
              className="px-6 py-3 text-base font-bold bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              次の問題
            </button>
          )}
          {showResult && !isCorrect && (
            <>
              <button
                type="button"
                onClick={retry}
                className="px-6 py-3 text-base font-bold bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              >
                リトライ
              </button>
              <button
                type="button"
                onClick={nextQuestion}
                className="px-6 py-3 text-base font-bold bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                次の問題へ
              </button>
            </>
          )}
          {!showResult && attemptCount >= 2 && (
            <button type="button" onClick={giveUp} className="px-6 py-3 text-base font-bold bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
              ギブアップ
            </button>
          )}
        </div>

        {showResult && (
          <div
            className={`mt-5 p-5 rounded-lg text-center text-lg ${isCorrect ? 'bg-green-50 text-green-700 border border-green-400' : 'bg-red-50 text-red-700 border border-red-400'}`}
          >
            {isCorrect ? (
              <span>正解！ 「{currentQuestion.kanji}」</span>
            ) : isGiveUp ? (
              <span>正解は「{currentQuestion.kanji}」でした。</span>
            ) : (
              <span>不正解です。もう一度挑戦してみましょう。</span>
            )}
          </div>
        )}

        <div className="text-center mt-5 text-xl text-gray-700 font-bold">
          スコア: {score} / {totalQuestions}
        </div>

        <div className="mt-3 text-center">
          <label className="text-sm text-gray-600">
            <input type="checkbox" checked={showDebug} onChange={(e) => setShowDebug(e.target.checked)} className="mr-1" />
            デバッグ情報を表示
          </label>
        </div>

        {showDebug && debugInfo && (
          <div className="mt-3 p-3 bg-gray-100 rounded text-xs text-gray-600">
            <div>
              ユーザー描画領域: {debugInfo.userBBox.width}×{debugInfo.userBBox.height}
            </div>
            <div className="mt-2">
              <strong>フォント別類似度:</strong>
              {debugInfo.allResults.map((result) => (
                <div key={result.font}>
                  {result.isBest ? '★' : '　'} {result.font}: {(result.f1Score * 100).toFixed(1)}% (適合率: {(result.precision * 100).toFixed(1)}%, 再現率:{' '}
                  {(result.recall * 100).toFixed(1)}%)
                </div>
              ))}
            </div>
            <div className="mt-2">
              <strong>最高スコア: {(Math.max(...debugInfo.allResults.map((r) => r.f1Score)) * 100).toFixed(1)}%</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
