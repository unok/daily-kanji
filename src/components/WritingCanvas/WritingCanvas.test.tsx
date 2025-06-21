import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { WritingCanvas } from './WritingCanvas'

describe('WritingCanvas', () => {
  it('キャンバスが表示される', () => {
    render(<WritingCanvas onImageCapture={() => {}} />)
    const canvas = screen.getByTestId('writing-canvas')
    expect(canvas).toBeInTheDocument()
  })

  it('クリアボタンが表示される', () => {
    render(<WritingCanvas onImageCapture={() => {}} />)
    const clearButton = screen.getByText('クリア')
    expect(clearButton).toBeInTheDocument()
  })

  it('クリアボタンをクリックするとキャンバスがクリアされる', () => {
    const mockContext = {
      clearRect: vi.fn(),
    }
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as unknown as typeof HTMLCanvasElement.prototype.getContext

    render(<WritingCanvas onImageCapture={() => {}} />)
    const clearButton = screen.getByText('クリア')

    fireEvent.click(clearButton)

    expect(mockContext.clearRect).toHaveBeenCalled()
  })

  it('マウスで線が描ける', () => {
    const mockContext = {
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      lineWidth: 0,
      strokeStyle: '',
      lineCap: '',
    }
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as unknown as typeof HTMLCanvasElement.prototype.getContext

    // getBoundingClientRectをモック
    const mockGetBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 300,
      height: 300,
      right: 300,
      bottom: 300,
      x: 0,
      y: 0,
    }))
    HTMLCanvasElement.prototype.getBoundingClientRect = mockGetBoundingClientRect as unknown as typeof HTMLCanvasElement.prototype.getBoundingClientRect

    render(<WritingCanvas onImageCapture={() => {}} />)
    const canvas = screen.getByTestId('writing-canvas')

    // マウスダウン
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
    expect(mockContext.beginPath).toHaveBeenCalled()
    // スケール計算: 256 / 300 = 0.853...
    const expectedX = 100 * (256 / 300)
    const expectedY = 100 * (256 / 300)
    expect(mockContext.moveTo).toHaveBeenCalledWith(expectedX, expectedY)

    // マウスムーブ
    fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 })
    const expectedMoveX = 150 * (256 / 300)
    const expectedMoveY = 150 * (256 / 300)
    expect(mockContext.lineTo).toHaveBeenCalledWith(expectedMoveX, expectedMoveY)
    expect(mockContext.stroke).toHaveBeenCalled()
  })

  it('タッチで線が描ける', () => {
    const mockContext = {
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      lineWidth: 0,
      strokeStyle: '',
      lineCap: '',
    }
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as unknown as typeof HTMLCanvasElement.prototype.getContext

    // getBoundingClientRectをモック
    const mockGetBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 300,
      height: 300,
      right: 300,
      bottom: 300,
      x: 0,
      y: 0,
    }))
    HTMLCanvasElement.prototype.getBoundingClientRect = mockGetBoundingClientRect as unknown as typeof HTMLCanvasElement.prototype.getBoundingClientRect

    render(<WritingCanvas onImageCapture={() => {}} />)
    const canvas = screen.getByTestId('writing-canvas')

    // タッチスタート
    fireEvent.touchStart(canvas, {
      touches: [{ clientX: 100, clientY: 100 }],
    })
    expect(mockContext.beginPath).toHaveBeenCalled()
    // スケール計算: 256 / 300 = 0.853...
    const expectedX = 100 * (256 / 300)
    const expectedY = 100 * (256 / 300)
    expect(mockContext.moveTo).toHaveBeenCalledWith(expectedX, expectedY)

    // タッチムーブ
    fireEvent.touchMove(canvas, {
      touches: [{ clientX: 200, clientY: 200 }],
    })
    const expectedMoveX = 200 * (256 / 300)
    const expectedMoveY = 200 * (256 / 300)
    expect(mockContext.lineTo).toHaveBeenCalledWith(expectedMoveX, expectedMoveY)
    expect(mockContext.stroke).toHaveBeenCalled()
  })

  it('確定ボタンで画像データを取得できる', () => {
    const mockToDataURL = vi.fn(() => 'data:image/png;base64,test')
    HTMLCanvasElement.prototype.toDataURL = mockToDataURL

    const onImageCapture = vi.fn()
    render(<WritingCanvas onImageCapture={onImageCapture} />)

    const submitButton = screen.getByText('確定')
    fireEvent.click(submitButton)

    expect(mockToDataURL).toHaveBeenCalledWith('image/png')
    expect(onImageCapture).toHaveBeenCalledWith('data:image/png;base64,test')
  })
})
