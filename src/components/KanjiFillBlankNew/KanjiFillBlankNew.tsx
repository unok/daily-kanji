import { type JSX, useCallback, useEffect, useState } from 'react'

import { type DifficultyLevel, getRandomQuestion } from '../../services/questionService'
import type { QuestionData } from '../../types/question'
import { DIFFICULTY_LABELS } from '../../types/question'
import { splitDisplaySentence } from '../../utils/questionParser'
import { MultiKanjiInput } from '../MultiKanjiInput'

// 類似度計算のためのフォント設定（将来的に使用予定）
// const _fontList = [
//   '"Hiragino Sans", "Meiryo", sans-serif',
//   '"Hiragino Mincho", "MS Mincho", serif',
//   '"Klee", "Comic Sans MS", cursive',
//   '"Yu Gothic", "Meiryo", sans-serif',
//   'serif',
// ]

interface KanjiFillBlankNewProps {
  difficulty?: DifficultyLevel
  onSessionComplete?: (score: number, total: number) => void
}

export function KanjiFillBlankNew({ difficulty = 'elementary', onSessionComplete }: KanjiFillBlankNewProps) {
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null)
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>(difficulty)
  const [attemptCount, setAttemptCount] = useState(0)
  const [score, setScore] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [results, setResults] = useState<Array<{ isCorrect: boolean; input: string; answer: string }>>([])
  const [isGiveUp, setIsGiveUp] = useState(false)
  const [sessionScore, setSessionScore] = useState(0)
  const [sessionQuestions, setSessionQuestions] = useState(0)
  const [_isFirstLoad, setIsFirstLoad] = useState(true)
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState<
    Array<{
      kanji: string
      similarity: number
      fontResults?: Array<{
        font: string
        f1Score: number
        precision: number
        recall: number
        isBest: boolean
      }>
    }>
  >([])
  // 認識精度の閾値（定数）
  const SIMILARITY_THRESHOLD = 0.5

  // 難易度変更時の処理
  useEffect(() => {
    setCurrentDifficulty(difficulty)
  }, [difficulty])

  // ランダムな問題を読み込む
  const loadRandomQuestion = useCallback(() => {
    const question = getRandomQuestion(currentDifficulty)
    setCurrentQuestion(question)
    setTotalQuestions((prev) => prev + 1)
    setAttemptCount(0)
    setShowResult(false)
    setResults([])
    setIsGiveUp(false)
  }, [currentDifficulty])

  useEffect(() => {
    setSessionQuestions(1)
    loadRandomQuestion()
    setIsFirstLoad(false)
  }, [loadRandomQuestion])

  // キャンバスから漢字を認識する
  const recognizeKanjiScore = useCallback(async (canvasDataUrl: string, expectedKanji: string): Promise<number> => {
    const { recognizeKanji } = await import('../../utils/kanjiRecognition')
    return recognizeKanji(canvasDataUrl, expectedKanji)
  }, [])

  // デバッグ情報付きで認識する
  const recognizeKanjiWithDebug = useCallback(async (canvasDataUrl: string, expectedKanji: string) => {
    const { recognizeKanjiWithDebug: recognizeDebug } = await import('../../utils/kanjiRecognition')
    return recognizeDebug(canvasDataUrl, expectedKanji)
  }, [])

  // 答え合わせ
  const checkAnswers = useCallback(
    async (canvasImages: string[]) => {
      if (!currentQuestion) return

      setAttemptCount((prev) => prev + 1)

      const debugData: typeof debugInfo = []

      const newResults = await Promise.all(
        currentQuestion.inputs.map(async (input, index) => {
          if (showDebug) {
            const debugResult = await recognizeKanjiWithDebug(canvasImages[index], input.kanji)
            debugData.push({
              kanji: input.kanji,
              similarity: debugResult.bestScore,
              fontResults: debugResult.results,
            })

            const isCorrect = debugResult.bestScore >= SIMILARITY_THRESHOLD
            return {
              isCorrect,
              input: canvasImages[index] ? `類似度: ${(debugResult.bestScore * 100).toFixed(1)}%` : '未入力',
              answer: input.kanji,
            }
          }
          const similarity = await recognizeKanjiScore(canvasImages[index], input.kanji)
          const isCorrect = similarity >= SIMILARITY_THRESHOLD

          return {
            isCorrect,
            input: canvasImages[index] ? `類似度: ${(similarity * 100).toFixed(1)}%` : '未入力',
            answer: input.kanji,
          }
        })
      )

      if (showDebug) {
        setDebugInfo(debugData)
      }

      setResults(newResults)
      setShowResult(true)

      // 全問正解の場合のみスコアを加算
      const allCorrect = newResults.every((r) => r.isCorrect)
      if (allCorrect && attemptCount === 0) {
        setScore((prev) => prev + 1)
        setSessionScore((prev) => prev + 1)
      }
    },
    [currentQuestion, attemptCount, recognizeKanjiScore, recognizeKanjiWithDebug, showDebug]
  )

  // リトライ
  const retry = useCallback(() => {
    setShowResult(false)
    setResults([])
    setIsGiveUp(false)
  }, [])

  // ギブアップ
  const giveUp = useCallback(() => {
    if (!currentQuestion) return

    const newResults = currentQuestion.inputs.map((input) => ({
      isCorrect: false,
      input: '',
      answer: input.kanji,
    }))

    setResults(newResults)
    setShowResult(true)
    setIsGiveUp(true)
  }, [currentQuestion])

  // 次の問題へ
  const nextQuestion = useCallback(() => {
    // 10問完了時にセッション結果を表示
    if (sessionQuestions === 10 && onSessionComplete) {
      onSessionComplete(sessionScore, 10)
      setSessionScore(0)
      setSessionQuestions(0)
    } else {
      setSessionQuestions((prev) => prev + 1)
      loadRandomQuestion()
    }
  }, [loadRandomQuestion, sessionQuestions, sessionScore, onSessionComplete])

  if (!currentQuestion) {
    return <div>Loading...</div>
  }

  const sentenceParts = splitDisplaySentence(currentQuestion.displaySentence)
  const allCorrect = results.length > 0 && results.every((r) => r.isCorrect)

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-5">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">漢字穴埋め学習</h1>

        {/* 問題文表示エリア */}
        <div className="bg-gray-50 p-8 rounded-lg mb-8">
          <div className="text-2xl text-gray-800 text-center flex flex-wrap items-center justify-center mx-auto" style={{ minHeight: '4rem' }}>
            {(() => {
              const elements: JSX.Element[] = []
              const skipIndices = new Set<number>()

              sentenceParts.forEach((part, partIndex) => {
                if (part.type === 'text') {
                  elements.push(
                    <span key={`text-${part.content}-${partIndex}`} className="inline-block align-middle" style={{ position: 'relative', top: '-2px' }}>
                      {part.content}
                    </span>
                  )
                } else if (part.type === 'input' && part.inputIndex !== undefined && !skipIndices.has(partIndex)) {
                  const input = currentQuestion.inputs[part.inputIndex]

                  // グループの最初の入力欄の場合
                  if (input.isGroupStart && input.groupSize && input.groupSize > 1) {
                    const groupInputs: JSX.Element[] = []

                    // 同じグループの入力欄を収集
                    for (let i = 0; i < input.groupSize; i++) {
                      const currentPart = sentenceParts[partIndex + i]
                      if (currentPart?.type === 'input' && currentPart.inputIndex !== undefined) {
                        const currentInput = currentQuestion.inputs[currentPart.inputIndex]
                        const currentResult = results[currentPart.inputIndex]
                        skipIndices.add(partIndex + i)

                        groupInputs.push(
                          <span
                            key={`input-${currentPart.inputIndex}`}
                            className="inline-flex w-12 h-12 border-2 border-blue-500 rounded bg-white items-center justify-center"
                          >
                            {showResult && (currentResult?.isCorrect || isGiveUp) && (
                              <span className={`font-bold text-xl ${currentResult?.isCorrect ? 'text-green-600' : 'text-red-600'}`}>{currentInput.kanji}</span>
                            )}
                          </span>
                        )
                      }
                    }

                    // グループ全体をラップして、ふりがなを上に表示
                    elements.push(
                      <span key={`group-${input.groupId}`} className="inline-block mx-1 relative align-middle">
                        {input.reading && <span className="absolute -top-5 left-0 right-0 text-center text-xs text-gray-500">{input.reading}</span>}
                        <span className="inline-flex gap-0.5">{groupInputs}</span>
                      </span>
                    )
                  } else if (!input.groupId || input.groupSize === 1) {
                    // 単独の入力欄
                    const result = results[part.inputIndex]
                    elements.push(
                      <span key={`input-${part.inputIndex}`} className="inline-block mx-1 relative align-middle">
                        {input.reading && <span className="absolute -top-5 left-0 right-0 text-center text-xs text-gray-500">{input.reading}</span>}
                        <span className="inline-flex w-12 h-12 border-2 border-blue-500 rounded bg-white items-center justify-center">
                          {showResult && (result?.isCorrect || isGiveUp) && (
                            <span className={`font-bold text-xl ${result?.isCorrect ? 'text-green-600' : 'text-red-600'}`}>{input.kanji}</span>
                          )}
                        </span>
                      </span>
                    )
                  }
                }
              })

              return elements
            })()}
          </div>
        </div>

        {/* 入力エリア */}
        <div className="mb-6">
          <div className="text-center mb-4 text-gray-600">下の枠に漢字を書いてください</div>
          <MultiKanjiInput inputs={currentQuestion.inputs} onSubmit={checkAnswers} disabled={showResult} />
        </div>

        {/* 操作ボタン */}
        {showResult && (
          <div className="flex gap-3 justify-center mt-6">
            {allCorrect ? (
              <button
                type="button"
                onClick={nextQuestion}
                className="px-6 py-3 text-base font-bold bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                次の問題
              </button>
            ) : (
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
          </div>
        )}

        {/* ギブアップボタン */}
        {!showResult && attemptCount >= 2 && (
          <div className="flex justify-center mt-4">
            <button type="button" onClick={giveUp} className="px-6 py-3 text-base font-bold bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
              ギブアップ
            </button>
          </div>
        )}

        {/* 結果表示 */}
        {showResult && (
          <div
            className={`mt-5 p-5 rounded-lg text-center text-lg ${
              allCorrect ? 'bg-green-50 text-green-700 border border-green-400' : 'bg-red-50 text-red-700 border border-red-400'
            }`}
          >
            {allCorrect ? (
              <span>全問正解！素晴らしい！</span>
            ) : isGiveUp ? (
              <span>正解は上に表示されています。次も頑張りましょう！</span>
            ) : (
              <span>
                {results.filter((r) => r.isCorrect).length} / {results.length} 問正解。
                {results.some((r) => !r.isCorrect) && ' もう一度挑戦してみましょう。'}
              </span>
            )}
          </div>
        )}

        {/* スコア表示 */}
        <div className="text-center mt-5 text-xl text-gray-700 font-bold">
          スコア: {score} / {totalQuestions}
        </div>

        {/* 難易度とカテゴリー表示 */}
        <div className="text-center mt-2 space-y-1">
          <div className="text-sm text-gray-600 font-medium">
            難易度:{' '}
            <span
              className={`font-bold ${
                currentQuestion.difficulty === 'elementary' ? 'text-green-600' : currentQuestion.difficulty === 'junior' ? 'text-blue-600' : 'text-purple-600'
              }`}
            >
              {DIFFICULTY_LABELS[currentQuestion.difficulty]}
            </span>
          </div>
          <div className="text-xs text-gray-500">カテゴリー: {currentQuestion.category}</div>
        </div>

        {/* デバッグ情報 */}
        <div className="mt-6 text-center">
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={showDebug} onChange={(e) => setShowDebug(e.target.checked)} className="sr-only peer" />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            <span className="ml-3 text-sm font-medium text-gray-700">デバッグ情報を表示</span>
          </label>
        </div>

        {/* デバッグ情報表示 */}
        {showDebug && showResult && debugInfo.length > 0 && (
          <div className="mt-4 bg-gray-100 p-4 rounded-lg text-left text-sm">
            <h3 className="font-bold text-gray-700 mb-2">認識結果の詳細</h3>
            {debugInfo.map((info, index) => (
              <div key={`debug-${info.kanji}-${index}`} className="mb-4 bg-white p-3 rounded">
                <div className="font-semibold mb-2">
                  「{info.kanji}」の認識結果 - 最高スコア: {(info.similarity * 100).toFixed(1)}%
                </div>
                {info.fontResults && (
                  <div className="space-y-1 text-xs">
                    {info.fontResults.map((result) => (
                      <div key={`font-${result.font}`} className={`flex justify-between ${result.isBest ? 'font-bold text-blue-600' : 'text-gray-600'}`}>
                        <span>
                          {result.isBest ? '★ ' : '　 '}
                          {result.font}:
                        </span>
                        <span>
                          {(result.f1Score * 100).toFixed(1)}% (適合率: {(result.precision * 100).toFixed(1)}%, 再現率: {(result.recall * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
