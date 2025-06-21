import { useCallback, useEffect, useState } from 'react'
import Tesseract from 'tesseract.js'

import type { Question as QuestionType } from '../../atoms/gameAtoms'
import { WritingCanvas } from '../WritingCanvas'

interface QuestionProps {
  question: QuestionType
  onAnswer: (answer: string) => void
}

export function Question({ question, onAnswer }: QuestionProps) {
  const [canvasId, setCanvasId] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [recognizedChar, setRecognizedChar] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isModelLoaded, setIsModelLoaded] = useState(false)

  // Tesseract.jsの初期化
  useEffect(() => {
    const loadModel = async () => {
      try {
        // 日本語モデルのプリロード
        await Tesseract.recognize(
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          'jpn',
          {
            logger: (m) => {
              if (m.status === 'loading language traineddata') {
                setProgress(Math.round(m.progress * 100))
              }
            },
          }
        )
        setIsModelLoaded(true)
      } catch (err) {
        console.error('モデル読み込みエラー:', err)
        setError('日本語認識モデルの読み込みに失敗しました')
      }
    }

    loadModel()
  }, [])

  const handleCanvasReady = useCallback((id: string) => {
    setCanvasId(id)
  }, [])

  const preprocessImage = (canvas: HTMLCanvasElement): string => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas.toDataURL()

    // 画像の前処理
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // グレースケール化とコントラスト強調
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      const enhanced = gray < 128 ? 0 : 255
      data[i] = enhanced
      data[i + 1] = enhanced
      data[i + 2] = enhanced
    }

    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL()
  }

  const handleImageCapture = async () => {
    if (!(canvasId && isModelLoaded)) return

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvas) return

    try {
      setIsProcessing(true)
      setError(null)
      setRecognizedChar(null)

      // 画像の前処理
      const processedImage = preprocessImage(canvas)

      // Tesseract.jsで認識
      const result = await Tesseract.recognize(processedImage, 'jpn', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          }
        },
      })

      // 認識結果から漢字を抽出
      const text = result.data.text.trim()

      // 漢字を抽出
      const kanjiMatch = text.match(/[\u4e00-\u9faf\u3400-\u4dbf]/)

      if (kanjiMatch) {
        setRecognizedChar(kanjiMatch[0])
      } else {
        // 認識できなかった場合、ヒントと文脈から推測
        const candidates = generateContextualCandidates(question)
        if (candidates.length > 0) {
          setRecognizedChar(candidates[0])
          setError('認識精度が低いため、文脈から推測しました')
        } else {
          setError('漢字を認識できませんでした')
        }
      }
    } catch (err) {
      console.error('認識エラー:', err)
      setError('文字認識に失敗しました')
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const generateContextualCandidates = (q: QuestionType): string[] => {
    // ヒントに基づいて候補を生成
    const hintToCandidates: { [key: string]: string[] } = {
      ひ: ['日', '火', '陽'],
      つき: ['月'],
      みず: ['水'],
      き: ['木', '気', '機'],
      かね: ['金', '鐘'],
      つち: ['土'],
      // ... 他のヒントも追加
    }

    return q.hint ? hintToCandidates[q.hint] || [] : []
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

  if (!isModelLoaded) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">日本語認識モデルを読み込み中...</h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-gray-600 mt-2">{progress}%</p>
          <p className="text-xs text-gray-500 mt-4">初回は約10MBのデータをダウンロードします</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8 mt-4">{renderQuestionWithFurigana()}</div>

      <div className="mb-2 text-center">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">Tesseract.js (WebAssembly) 使用中</span>
      </div>

      <WritingCanvas onImageCapture={handleImageCapture} onCanvasReady={handleCanvasReady} key={`canvas-${question.id}`} />

      {isProcessing && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
            <span className="text-gray-600">認識中... {progress}%</span>
          </div>
        </div>
      )}

      {error && <div className="mt-4 text-center text-orange-600 text-sm">{error}</div>}

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

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">※ Tesseract.jsは印刷文字向けのため、手書き認識の精度は限定的です</p>
      </div>
    </div>
  )
}
