import { useCallback, useEffect, useState } from 'react'

import type { Question as QuestionType } from '../../atoms/gameAtoms'
import { WritingCanvas } from '../WritingCanvas'

interface QuestionProps {
  question: QuestionType
  onAnswer: (answer: string) => void
}

declare global {
  interface Window {
    electronAPI?: {
      recognizeHandwriting: (imageDataUrl: string) => Promise<{
        success: boolean
        error?: string
        fullText?: string
        kanjis?: string[]
        words?: Array<{
          text: string
          boundingRect: {
            x: number
            y: number
            width: number
            height: number
          }
          confidence: number
        }>
        topResult?: string | null
      }>
      getPlatformInfo: () => Promise<{
        platform: string
        isWindows: boolean
        ocrAvailable: boolean
      }>
    }
  }
}

export function Question({ question, onAnswer }: QuestionProps) {
  const [canvasId, setCanvasId] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [recognizedChar, setRecognizedChar] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isElectron, setIsElectron] = useState(false)
  const [ocrAvailable, setOcrAvailable] = useState(false)

  // Electron環境かどうかチェック
  useEffect(() => {
    const checkElectron = async () => {
      if (window.electronAPI) {
        setIsElectron(true)
        try {
          const info = await window.electronAPI.getPlatformInfo()
          setOcrAvailable(info.ocrAvailable)
          if (!info.ocrAvailable) {
            setError('OCRエンジンの初期化に失敗しました')
          }
        } catch (_err) {
          setError('プラットフォーム情報の取得に失敗しました')
        }
      }
    }
    checkElectron()
  }, [])

  const handleCanvasReady = useCallback((id: string) => {
    setCanvasId(id)
  }, [])

  const handleImageCapture = async () => {
    if (!(canvasId && window.electronAPI && ocrAvailable)) return

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvas) return

    try {
      setIsProcessing(true)
      setError(null)
      setRecognizedChar(null)

      // キャンバスの画像データを取得
      const imageDataUrl = canvas.toDataURL('image/png')

      // Electronメインプロセスで認識
      const result = await window.electronAPI.recognizeHandwriting(imageDataUrl)

      if (result.success) {
        if (result.topResult) {
          setRecognizedChar(result.topResult)
        } else if (result.kanjis && result.kanjis.length > 0) {
          setRecognizedChar(result.kanjis[0])
        } else {
          setError('漢字を認識できませんでした')
        }
      } else {
        setError(result.error || '認識に失敗しました')
      }
    } catch (err) {
      console.error('認識エラー:', err)
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

  if (!isElectron) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4 text-red-600">Electron環境が必要です</h3>
          <p className="text-gray-700 mb-4">高精度な手書き認識を使用するには、Electronアプリとして実行してください。</p>
          <p className="text-sm text-gray-600">
            開発モード: <code className="bg-gray-200 px-1">npm run electron:dev</code>
          </p>
        </div>
      </div>
    )
  }

  if (!ocrAvailable) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4 text-orange-600">OCRが利用できません</h3>
          {error && <p className="text-red-600 mb-4">{error}</p>}
          <p className="text-sm text-gray-600">OCRエンジンを初期化しています...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8 mt-4">{renderQuestionWithFurigana()}</div>

      <div className="mb-2 text-center">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">Electron版 OCR 使用中</span>
      </div>

      <WritingCanvas onImageCapture={handleImageCapture} onCanvasReady={handleCanvasReady} key={`canvas-${question.id}`} />

      {isProcessing && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2" />
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
