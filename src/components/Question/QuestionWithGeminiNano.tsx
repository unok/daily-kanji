import { useCallback, useEffect, useState } from 'react'

import type { Question as QuestionType } from '../../atoms/gameAtoms'
import { WritingCanvas } from '../WritingCanvas'

/// <reference path="../../types/gemini.d.ts" />

interface QuestionProps {
  question: QuestionType
  onAnswer: (answer: string) => void
}

export function Question({ question, onAnswer }: QuestionProps) {
  const [canvasId, setCanvasId] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [recognizedChar, setRecognizedChar] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<{
    prompt: (text: string) => Promise<string>
    destroy: () => void
  } | null>(null)
  const [isGeminiAvailable, setIsGeminiAvailable] = useState(false)

  // Gemini Nano の初期化
  useEffect(() => {
    const initGemini = async () => {
      try {
        if ('ai' in window && window.ai?.languageModel) {
          const capabilities = await window.ai.languageModel.capabilities?.()
          if (capabilities?.available === 'readily') {
            const model = await window.ai.languageModel.create?.({
              systemPrompt: `あなたは日本語の手書き文字認識アシスタントです。
ユーザーが手書きした漢字の画像データから、最も可能性の高い1つの漢字を認識してください。
回答は必ず1文字の漢字のみを返してください。説明や他の文字は一切含めないでください。
もし認識できない場合は「？」を返してください。`,
            })
            if (model) {
              setSession(model)
            }
            setIsGeminiAvailable(true)
          } else {
            setError('Gemini Nano は利用できません。Chrome Canary で chrome://flags/#optimization-guide-on-device-model を有効にしてください。')
          }
        } else {
          setError('このブラウザではGemini Nano APIが利用できません。')
        }
      } catch (_err) {
        // console.error('Gemini Nano 初期化エラー:', _err)
        setError('Gemini Nano の初期化に失敗しました。')
      }
    }

    initGemini()

    return () => {
      if (session) {
        session.destroy?.()
      }
    }
  }, [session])

  const handleCanvasReady = useCallback((id: string) => {
    setCanvasId(id)
  }, [])

  const handleImageCapture = async () => {
    if (!(session && canvasId)) {
      setError('Gemini Nano が利用できません')
      return
    }

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvas) return

    try {
      setIsProcessing(true)
      setError(null)
      setRecognizedChar(null)

      // キャンバスの画像データを取得
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context を取得できません')

      // 画像データを文字列として表現（簡易的な方法）
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // 黒いピクセルの位置を文字列化（簡易表現）
      let strokeInfo = '手書きされた文字の特徴:\n'
      let blackPixelCount = 0
      let totalX = 0
      let totalY = 0

      for (let y = 0; y < canvas.height; y += 10) {
        for (let x = 0; x < canvas.width; x += 10) {
          const idx = (y * canvas.width + x) * 4
          const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
          if (brightness < 128) {
            blackPixelCount++
            totalX += x
            totalY += y
          }
        }
      }

      if (blackPixelCount === 0) {
        setError('何も書かれていません')
        setIsProcessing(false)
        return
      }

      // 重心位置を計算
      const centerX = Math.round((totalX / blackPixelCount / canvas.width) * 100)
      const centerY = Math.round((totalY / blackPixelCount / canvas.height) * 100)

      strokeInfo += `- ストロークの中心位置: (${centerX}%, ${centerY}%)\n`
      strokeInfo += `- ストロークの密度: ${Math.round(blackPixelCount / 100)}\n`

      // プロンプトを作成
      const prompt = `${strokeInfo}
この手書き文字は「${question.hint}」と読む漢字です。
文脈：「${question.sentence}」
この文脈で最も適切な1文字の漢字を答えてください。`

      // Gemini Nano に認識を依頼
      const result = await session.prompt(prompt)

      // 結果から漢字を抽出
      const kanjiMatch = result.match(/[\u4e00-\u9faf\u3400-\u4dbf]/)
      if (kanjiMatch) {
        setRecognizedChar(kanjiMatch[0])
      } else {
        setError('漢字を認識できませんでした')
      }
    } catch (_err) {
      // console.error('認識エラー:', _err)
      setError('文字認識に失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmit = () => {
    if (recognizedChar) {
      onAnswer(recognizedChar)
    }
  }

  const handleRetry = () => {
    setRecognizedChar(null)
    setError(null)
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
            <span className="text-sm text-red-500 font-medium absolute -top-7 left-0 right-0 text-center whitespace-nowrap">{question.hint}</span>
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

  if (!isGeminiAvailable) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4 text-red-600">Gemini Nano が利用できません</h3>
          <p className="text-gray-700 mb-4">Gemini Nano を使用するには：</p>
          <ol className="text-left text-sm text-gray-600 mb-4">
            <li>1. Chrome Canary をインストール</li>
            <li>2. chrome://flags/#optimization-guide-on-device-model を「Enabled BypassPerfRequirement」に設定</li>
            <li>3. chrome://flags/#prompt-api-for-gemini-nano を「Enabled」に設定</li>
            <li>4. Chrome を再起動</li>
            <li>5. chrome://components/ で「Optimization Guide On Device Model」を確認</li>
          </ol>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8 mt-4">{renderQuestionWithFurigana()}</div>

      <div className="mb-2 text-center">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">Gemini Nano 使用中</span>
      </div>

      <WritingCanvas onImageCapture={handleImageCapture} onCanvasReady={handleCanvasReady} key={`canvas-${question.id}`} />

      {isProcessing && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2" />
            <span className="text-gray-600">認識中...</span>
          </div>
        </div>
      )}

      {error && <div className="mt-4 text-center text-red-600">{error}</div>}

      {recognizedChar && (
        <div className="mt-6 text-center">
          <p className="text-lg mb-2">
            認識結果: <span className="text-3xl font-bold text-blue-600">{recognizedChar}</span>
          </p>
          {recognizedChar === question.answer ? (
            <div>
              <p className="text-green-600 font-bold mb-4">正解です！</p>
              <button type="button" onClick={handleSubmit} className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
                次の問題へ
              </button>
            </div>
          ) : (
            <div>
              <p className="text-red-600 mb-4">もう一度書いてみましょう（正解: {question.answer}）</p>
              <button type="button" onClick={handleRetry} className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                もう一度書く
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
