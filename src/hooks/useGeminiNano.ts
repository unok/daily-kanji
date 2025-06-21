import { useCallback, useEffect, useState } from 'react'
/// <reference path="../types/gemini.d.ts" />

export function useGeminiNano() {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<{
    prompt: (text: string) => Promise<string>
    destroy: () => void
  } | null>(null)

  useEffect(() => {
    // Check if Gemini Nano is available
    const checkAvailability = async () => {
      if ('ai' in window && window.ai?.languageModel) {
        setIsAvailable(true)
        try {
          if (window.ai.languageModel.create) {
            const model = await window.ai.languageModel.create({
              systemPrompt:
                'You are a Japanese kanji recognition assistant. When given a description of handwritten strokes or an image, identify the most likely kanji character. Respond with only the single kanji character, nothing else.',
            })
            setSession(model)
          }
        } catch (_err) {
          // console.error('Failed to create Gemini Nano session:', _err)
          setError('Gemini Nanoの初期化に失敗しました')
        }
      } else {
        setError('Gemini Nanoは利用できません。Chrome Canaryで chrome://flags/#optimization-guide-on-device-model を有効にしてください。')
      }
    }

    checkAvailability()

    return () => {
      if (session) {
        session.destroy()
      }
    }
  }, [session])

  const recognizeFromCanvas = useCallback(
    async (canvasId: string) => {
      if (!(session && isAvailable)) {
        setError('Gemini Nanoが利用できません')
        return null
      }

      const canvas = document.getElementById(canvasId) as HTMLCanvasElement
      if (!canvas) {
        setError('キャンバスが見つかりません')
        return null
      }

      try {
        setIsLoading(true)
        setError(null)

        // Get canvas data as base64
        const imageData = canvas.toDataURL('image/png')

        // Create a prompt describing the task
        const prompt = `手書きの漢字を認識してください。画像データ: ${imageData.substring(0, 100)}... 最も可能性の高い漢字1文字だけを答えてください。`

        const result = await session.prompt(prompt)

        // Extract only the kanji character from the response
        const kanjiMatch = result.match(/[\u4e00-\u9faf]/)
        if (kanjiMatch) {
          return kanjiMatch[0]
        }
        setError('漢字を認識できませんでした')
        return null
      } catch (_err) {
        // console.error('Recognition error:', _err)
        setError('文字認識に失敗しました')
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [session, isAvailable]
  )

  return {
    isAvailable,
    isLoading,
    error,
    recognizeFromCanvas,
  }
}
