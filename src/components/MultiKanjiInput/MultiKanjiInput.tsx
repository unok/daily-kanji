import { type MouseEvent, type TouchEvent, useCallback, useEffect, useRef, useState } from 'react'

import type { KanjiInput } from '../../types/question'

interface CanvasState {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  isDrawing: boolean
}

interface MultiKanjiInputProps {
  inputs: KanjiInput[]
  onSubmit: (answers: string[]) => void
  disabled?: boolean
}

export function MultiKanjiInput({ inputs, onSubmit, disabled = false }: MultiKanjiInputProps) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const [canvasStates, setCanvasStates] = useState<CanvasState[]>([])
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  // キャンバスの初期化
  useEffect(() => {
    const states: CanvasState[] = []

    inputs.forEach((_, index) => {
      const canvas = canvasRefs.current[index]
      if (canvas) {
        const context = canvas.getContext('2d')
        if (context) {
          context.lineWidth = 6
          context.lineCap = 'round'
          context.strokeStyle = '#000'

          states.push({
            canvas,
            context,
            isDrawing: false,
          })
        }
      }
    })

    setCanvasStates(states)
  }, [inputs])

  // 描画開始
  const startDrawing = useCallback(
    (index: number, x: number, y: number) => {
      const state = canvasStates[index]
      if (!state || disabled) return

      const rect = state.canvas.getBoundingClientRect()
      const newStates = [...canvasStates]
      newStates[index] = { ...state, isDrawing: true }
      setCanvasStates(newStates)

      state.context.beginPath()
      state.context.moveTo(x - rect.left, y - rect.top)
    },
    [canvasStates, disabled]
  )

  // 描画
  const draw = useCallback(
    (index: number, x: number, y: number) => {
      const state = canvasStates[index]
      if (!state?.isDrawing || disabled) return

      const rect = state.canvas.getBoundingClientRect()
      state.context.lineTo(x - rect.left, y - rect.top)
      state.context.stroke()
    },
    [canvasStates, disabled]
  )

  // 描画終了
  const stopDrawing = useCallback(
    (index: number) => {
      const state = canvasStates[index]
      if (!state) return

      const newStates = [...canvasStates]
      newStates[index] = { ...state, isDrawing: false }
      setCanvasStates(newStates)
    },
    [canvasStates]
  )

  // キャンバスをクリア
  const clearCanvas = useCallback(
    (index: number) => {
      const state = canvasStates[index]
      if (!state) return

      state.context.clearRect(0, 0, state.canvas.width, state.canvas.height)
    },
    [canvasStates]
  )

  // 全てのキャンバスをクリア
  const clearAllCanvas = useCallback(() => {
    canvasStates.forEach((_, index) => clearCanvas(index))
  }, [canvasStates, clearCanvas])

  // マウスイベントハンドラー
  const handleMouseDown = (index: number) => (e: MouseEvent<HTMLCanvasElement>) => {
    setFocusedIndex(index)
    startDrawing(index, e.clientX, e.clientY)
  }

  const handleMouseMove = (index: number) => (e: MouseEvent<HTMLCanvasElement>) => {
    draw(index, e.clientX, e.clientY)
  }

  const handleMouseUp = (index: number) => () => {
    stopDrawing(index)
  }

  // タッチイベントハンドラー
  const handleTouchStart = (index: number) => (e: TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    setFocusedIndex(index)
    const touch = e.touches[0]
    startDrawing(index, touch.clientX, touch.clientY)
  }

  const handleTouchMove = (index: number) => (e: TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    draw(index, touch.clientX, touch.clientY)
  }

  const handleTouchEnd = (index: number) => () => {
    stopDrawing(index)
  }

  // キャンバスから画像データを取得
  const getCanvasImages = useCallback((): string[] => {
    return canvasStates.map((state) => {
      if (!state) return ''

      // キャンバスの内容を判定用に取得
      const imageData = state.context.getImageData(0, 0, state.canvas.width, state.canvas.height)
      const data = imageData.data

      // 何か描かれているかチェック
      let hasContent = false
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) {
          hasContent = true
          break
        }
      }

      return hasContent ? state.canvas.toDataURL() : ''
    })
  }, [canvasStates])

  // 提出処理
  const handleSubmit = useCallback(() => {
    const images = getCanvasImages()
    onSubmit(images)
  }, [getCanvasImages, onSubmit])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 justify-center items-start">
        {inputs.map((input, index) => (
          <div key={`input-${input.index}`} className="flex flex-col items-center">
            <div className="text-sm text-gray-600 mb-1 font-medium">{input.reading}</div>
            <div className="relative">
              <canvas
                ref={(el) => {
                  canvasRefs.current[index] = el
                }}
                width={100}
                height={100}
                className={`border-2 ${focusedIndex === index ? 'border-blue-500' : 'border-gray-400'} rounded bg-white cursor-crosshair ${
                  disabled ? 'opacity-50' : ''
                }`}
                tabIndex={disabled ? -1 : 0}
                onMouseDown={handleMouseDown(index)}
                onMouseMove={handleMouseMove(index)}
                onMouseUp={handleMouseUp(index)}
                onMouseOut={handleMouseUp(index)}
                onBlur={handleMouseUp(index)}
                onTouchStart={handleTouchStart(index)}
                onTouchMove={handleTouchMove(index)}
                onTouchEnd={handleTouchEnd(index)}
              />
              <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <title>Canvas grid lines</title>
                <line x1="50" y1="0" x2="50" y2="100" stroke="#e0e0e0" strokeWidth="1" strokeDasharray="2, 2" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#e0e0e0" strokeWidth="1" strokeDasharray="2, 2" />
              </svg>
            </div>
            <button
              type="button"
              onClick={() => clearCanvas(index)}
              className="mt-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
              disabled={disabled}
            >
              消す
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <button
          type="button"
          onClick={clearAllCanvas}
          className="px-6 py-3 text-base font-bold bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
          disabled={disabled}
        >
          全て消す
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-6 py-3 text-base font-bold bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
          disabled={disabled}
        >
          答え合わせ
        </button>
      </div>
    </div>
  )
}
