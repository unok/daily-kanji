import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useKanjiRecognition } from './useKanjiRecognition'

// KanjiCanvasのモック
const mockKanjiCanvas = {
  init: vi.fn(),
  recognize: vi.fn(),
  erase: vi.fn(),
  deleteLast: vi.fn(),
}

describe('useKanjiRecognition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // windowオブジェクトにKanjiCanvasをモック
    window.KanjiCanvas = mockKanjiCanvas
  })

  it('初期状態が正しい', () => {
    const { result } = renderHook(() => useKanjiRecognition())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.recognizedCharacter).toBe(null)
  })

  it('KanjiCanvasが利用できない場合はエラーが表示される', () => {
    // KanjiCanvasをundefinedに設定
    window.KanjiCanvas = undefined as unknown as typeof window.KanjiCanvas

    const { result } = renderHook(() => useKanjiRecognition())

    expect(result.current.error).toBe('KanjiCanvasが読み込まれていません')
  })

  it('recognizeFromCanvasが正しく動作する', async () => {
    const { result } = renderHook(() => useKanjiRecognition())

    act(() => {
      result.current.recognizeFromCanvas('test-canvas')
    })

    expect(mockKanjiCanvas.recognize).toHaveBeenCalledWith('test-canvas')
    expect(result.current.isLoading).toBe(true)

    // setTimeoutが完了するまで待つ
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 600 }
    )
  })

  it('clearCanvasが正しく動作する', () => {
    const { result } = renderHook(() => useKanjiRecognition())

    act(() => {
      result.current.clearCanvas('test-canvas')
    })

    expect(mockKanjiCanvas.erase).toHaveBeenCalledWith('test-canvas')
  })

  it('recognizeCharacterが互換性のためのエラーを返す', () => {
    const { result } = renderHook(() => useKanjiRecognition())

    act(() => {
      result.current.recognizeCharacter('dummy-image-data')
    })

    expect(result.current.error).toBe('この機能は現在サポートされていません。キャンバスから直接認識してください。')
  })
})
