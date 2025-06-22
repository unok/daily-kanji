import { useCallback, useEffect, useState } from 'react'

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

  // 難易度変更時の処理
  useEffect(() => {
    setCurrentDifficulty(difficulty)
  }, [difficulty])

  // ランダムな問題を読み込む
  const loadRandomQuestion = useCallback(() => {
    const question = getRandomQuestion(currentDifficulty)
    setCurrentQuestion(question)
    setTotalQuestions((prev) => prev + 1)
    setSessionQuestions((prev) => prev + 1)
    setAttemptCount(0)
    setShowResult(false)
    setResults([])
    setIsGiveUp(false)

    // 10問ごとにセッション完了を通知
    if (sessionQuestions >= 9 && onSessionComplete) {
      onSessionComplete(sessionScore, 10)
      setSessionScore(0)
      setSessionQuestions(0)
    }
  }, [currentDifficulty, sessionQuestions, sessionScore, onSessionComplete])

  useEffect(() => {
    loadRandomQuestion()
  }, [loadRandomQuestion])

  // キャンバスから漢字を認識する（簡易版）
  const recognizeKanji = useCallback((canvasDataUrl: string, _expectedKanji: string): number => {
    // TODO: 実際の認識処理を実装
    // 現在は仮の実装として、キャンバスにデータがあれば0.5、なければ0を返す
    return canvasDataUrl ? 0.5 : 0
  }, [])

  // 答え合わせ
  const checkAnswers = useCallback(
    (canvasImages: string[]) => {
      if (!currentQuestion) return

      setAttemptCount((prev) => prev + 1)

      const newResults = currentQuestion.inputs.map((input, index) => {
        const similarity = recognizeKanji(canvasImages[index], input.kanji)
        const isCorrect = similarity >= 0.45

        return {
          isCorrect,
          input: canvasImages[index] ? '入力あり' : '未入力',
          answer: input.kanji,
        }
      })

      setResults(newResults)
      setShowResult(true)

      // 全問正解の場合のみスコアを加算
      const allCorrect = newResults.every((r) => r.isCorrect)
      if (allCorrect && attemptCount === 0) {
        setScore((prev) => prev + 1)
        setSessionScore((prev) => prev + 1)
      }
    },
    [currentQuestion, attemptCount, recognizeKanji]
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
    loadRandomQuestion()
  }, [loadRandomQuestion])

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
          <div className="text-2xl text-gray-800 leading-loose text-center">
            {sentenceParts.map((part) => {
              if (part.type === 'text') {
                return <span key={`text-${part.content}`}>{part.content}</span>
              }
              if (part.type === 'input' && part.inputIndex !== undefined) {
                const input = currentQuestion.inputs[part.inputIndex]
                const result = results[part.inputIndex]
                return (
                  <span key={`input-${part.inputIndex}`} className="inline-block mx-1 relative">
                    <span className="inline-block w-20 h-12 border-2 border-blue-500 rounded bg-white text-center leading-10 align-middle">
                      {showResult && (result?.isCorrect || isGiveUp) && (
                        <span className={`font-bold text-xl ${result?.isCorrect ? 'text-green-600' : 'text-red-600'}`}>{input.kanji}</span>
                      )}
                    </span>
                  </span>
                )
              }
              return null
            })}
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
                {results.filter((r) => r.isCorrect).length} / {results.length} 問正解。 もう一度挑戦してみましょう。
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
      </div>
    </div>
  )
}
