import { describe, expect, it } from 'vitest'

import { calculateInputWidth, parseQuestion, splitDisplaySentence } from './questionParser'

describe('questionParser', () => {
  describe('parseQuestion', () => {
    it('単一の入力欄を正しくパースする', () => {
      const result = parseQuestion('本日は[晴天|せいてん]なり')

      expect(result.displaySentence).toBe('本日は〔　　〕なり')
      expect(result.inputs).toHaveLength(1)
      expect(result.inputs[0]).toEqual({
        kanji: '晴天',
        reading: 'せいてん',
        position: 3,
        index: 0,
      })
    })

    it('複数の入力欄を正しくパースする', () => {
      const result = parseQuestion('[今日|きょう]は[晴天|せいてん]なり')

      expect(result.displaySentence).toBe('〔　　〕は〔　　〕なり')
      expect(result.inputs).toHaveLength(2)
      expect(result.inputs[0]).toEqual({
        kanji: '今日',
        reading: 'きょう',
        position: 0,
        index: 0,
      })
      expect(result.inputs[1]).toEqual({
        kanji: '晴天',
        reading: 'せいてん',
        position: 9,
        index: 1,
      })
    })

    it('入力欄がない場合はそのまま返す', () => {
      const result = parseQuestion('本日は晴天なり')

      expect(result.displaySentence).toBe('本日は晴天なり')
      expect(result.inputs).toHaveLength(0)
    })

    it('1文字の漢字も正しく処理する', () => {
      const result = parseQuestion('[今|いま]、[雨|あめ]が降る')

      expect(result.displaySentence).toBe('〔　　〕、〔　　〕が降る')
      expect(result.inputs).toHaveLength(2)
    })
  })

  describe('calculateInputWidth', () => {
    it('1文字の場合は最小幅を返す', () => {
      expect(calculateInputWidth(1)).toBe(80)
    })

    it('2文字の場合は80pxを返す', () => {
      expect(calculateInputWidth(2)).toBe(80)
    })

    it('3文字以上の場合は文字数×40pxを返す', () => {
      expect(calculateInputWidth(3)).toBe(120)
      expect(calculateInputWidth(4)).toBe(160)
    })
  })

  describe('splitDisplaySentence', () => {
    it('入力欄を含む文章を正しく分割する', () => {
      const parts = splitDisplaySentence('本日は〔　　〕なり')

      expect(parts).toHaveLength(3)
      expect(parts[0]).toEqual({ type: 'text', content: '本日は' })
      expect(parts[1]).toEqual({ type: 'input', content: '〔　　〕', inputIndex: 0 })
      expect(parts[2]).toEqual({ type: 'text', content: 'なり' })
    })

    it('複数の入力欄を含む文章を正しく分割する', () => {
      const parts = splitDisplaySentence('〔　　〕は〔　　〕なり')

      expect(parts).toHaveLength(4)
      expect(parts[0]).toEqual({ type: 'input', content: '〔　　〕', inputIndex: 0 })
      expect(parts[1]).toEqual({ type: 'text', content: 'は' })
      expect(parts[2]).toEqual({ type: 'input', content: '〔　　〕', inputIndex: 1 })
      expect(parts[3]).toEqual({ type: 'text', content: 'なり' })
    })

    it('入力欄がない場合は全てテキストとして返す', () => {
      const parts = splitDisplaySentence('本日は晴天なり')

      expect(parts).toHaveLength(1)
      expect(parts[0]).toEqual({ type: 'text', content: '本日は晴天なり' })
    })
  })
})
