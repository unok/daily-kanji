import { useCallback, useEffect, useState } from 'react'

// KanjiCanvasのグローバル宣言
declare global {
  interface Window {
    KanjiCanvas: {
      init: (canvasId: string) => void
      recognize: (canvasId: string, callback?: (results: Array<{ k: string; s: number }>) => void) => void
      erase: (canvasId: string) => void
      deleteLast: (canvasId: string) => void
    }
  }
}

export function useKanjiRecognition() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recognizedCharacter, setRecognizedCharacter] = useState<string | null>(null)

  useEffect(() => {
    // KanjiCanvasが利用可能か確認
    if (!window.KanjiCanvas) {
      setError('KanjiCanvasが読み込まれていません')
    }
  }, [])

  const recognizeFromCanvas = useCallback((canvasId: string) => {
    if (!window.KanjiCanvas) {
      setError('KanjiCanvasが利用できません')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      window.KanjiCanvas.recognize(canvasId)

      // 結果はdata-candidate-list属性で指定された要素に自動的に表示される
      // 少し待ってから候補要素を確認
      setTimeout(() => {
        const candidateElement = document.getElementById('kanji-candidates')
        if (candidateElement) {
          const buttons = candidateElement.getElementsByTagName('button')
          if (buttons.length > 0) {
            // 最初の候補を取得
            const firstCandidate = buttons[0].textContent
            if (firstCandidate) {
              setRecognizedCharacter(firstCandidate)
            }
          } else {
            setError('文字を認識できませんでした')
          }
        }
        setIsLoading(false)
      }, 500) // タイミングを少し遅らせる
    } catch (_err) {
      // console.error('Recognition error:', _err)
      setError('文字認識に失敗しました')
      setIsLoading(false)
    }
  }, [])

  const clearCanvas = useCallback((canvasId: string) => {
    if (window.KanjiCanvas?.erase) {
      window.KanjiCanvas.erase(canvasId)
      setRecognizedCharacter(null)
    }
  }, [])

  // 互換性のため、既存のインターフェースも残す
  const recognizeCharacter = useCallback((_imageData: string) => {
    // このメソッドは使用されないが、互換性のため残す
    setError('この機能は現在サポートされていません。キャンバスから直接認識してください。')
  }, [])

  return {
    isLoading,
    error,
    recognizedCharacter,
    recognizeCharacter,
    recognizeFromCanvas,
    clearCanvas,
  }
}
