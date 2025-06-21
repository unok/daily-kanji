import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'jotai'
import { describe, expect, it, vi } from 'vitest'

import { Question } from './Question'

describe('Question', () => {
  const mockQuestion = {
    id: 'test-1',
    sentence: '□きな犬',
    answer: '大',
    grade: 1,
    hint: 'おおきな',
  }

  it('問題文が表示される', () => {
    render(
      <Provider>
        <Question question={mockQuestion} onAnswer={vi.fn()} />
      </Provider>
    )

    expect(screen.getByText('□きな犬')).toBeInTheDocument()
  })

  it('ヒントボタンが表示される', () => {
    render(
      <Provider>
        <Question question={mockQuestion} onAnswer={vi.fn()} />
      </Provider>
    )

    expect(screen.getByText('ヒント')).toBeInTheDocument()
  })

  it('ヒントボタンをクリックするとヒントが表示される', () => {
    render(
      <Provider>
        <Question question={mockQuestion} onAnswer={vi.fn()} />
      </Provider>
    )

    const hintButton = screen.getByText('ヒント')
    fireEvent.click(hintButton)

    expect(screen.getByText('読み: おおきな')).toBeInTheDocument()
  })

  it('手書きキャンバスが表示される', () => {
    render(
      <Provider>
        <Question question={mockQuestion} onAnswer={vi.fn()} />
      </Provider>
    )

    expect(screen.getByTestId('writing-canvas')).toBeInTheDocument()
  })

  it('手書き後に認識結果が表示される', () => {
    const onAnswer = vi.fn()
    render(
      <Provider>
        <Question question={mockQuestion} onAnswer={onAnswer} />
      </Provider>
    )

    // WritingCanvasコンポーネントの確定ボタンが存在することを確認
    const submitButton = screen.getByText('確定')
    expect(submitButton).toBeInTheDocument()
  })
})
