import { type MouseEvent, type TouchEvent, useEffect, useRef, useState } from 'react'

interface WritingCanvasProps {
  onImageCapture: (imageData: string) => void
  canvasId?: string
  onCanvasReady?: (canvasId: string) => void
}

export function WritingCanvas({ onImageCapture, canvasId = 'writing-canvas', onCanvasReady }: WritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineWidth = 2.5
    ctx.strokeStyle = '#000000'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    setContext(ctx)

    // KanjiCanvasを初期化
    const initKanjiCanvas = () => {
      if (window.KanjiCanvas && typeof window.KanjiCanvas.init === 'function') {
        try {
          window.KanjiCanvas.init(canvasId)
        } catch (error) {
          console.error('Failed to initialize KanjiCanvas:', error)
        }
      }
    }

    // 即座に初期化を試みる
    initKanjiCanvas()

    // スクリプトの読み込みが遅れている場合のために、少し遅延してから再試行
    const timeoutId = setTimeout(initKanjiCanvas, 100)

    // キャンバスの準備ができたことを通知
    if (onCanvasReady) {
      onCanvasReady(canvasId)
    }

    return () => {
      clearTimeout(timeoutId)
    }
  }, [canvasId, onCanvasReady])

  const getCanvasCoordinates = (x: number, y: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 }

    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height

    return {
      x: (x - rect.left) * scaleX,
      y: (y - rect.top) * scaleY,
    }
  }

  const startDrawing = (x: number, y: number) => {
    if (!(context && canvasRef.current)) return

    const coords = getCanvasCoordinates(x, y)
    context.beginPath()
    context.moveTo(coords.x, coords.y)
    setIsDrawing(true)
  }

  const draw = (x: number, y: number) => {
    if (!(isDrawing && context && canvasRef.current)) return

    const coords = getCanvasCoordinates(x, y)
    context.lineTo(coords.x, coords.y)
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

    // KanjiCanvasのクリア
    if (window.KanjiCanvas?.erase) {
      window.KanjiCanvas.erase(canvasId)
    }
  }

  const captureImage = () => {
    if (!canvasRef.current) return
    const imageData = canvasRef.current.toDataURL('image/png')
    onImageCapture(imageData)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        id={canvasId}
        width={256}
        height={256}
        data-testid="writing-canvas"
        className="border-2 border-gray-400 rounded-lg bg-white touch-none"
        data-candidate-list="kanji-candidates"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={stopDrawing}
      />
      <div className="flex gap-4">
        <button type="button" onClick={clearCanvas} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
          クリア
        </button>
        <button type="button" onClick={captureImage} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          確定
        </button>
      </div>
      <div data-testid="kanji-candidates" className="mt-2 flex flex-wrap gap-2 justify-center" />
    </div>
  )
}
