import type { KanjiInput, ParseResult } from '../types/question'

/**
 * 問題文をパースして表示用文章と入力欄情報を生成
 * 例: "本日は[晴天|せいてん]なり" => "本日は〔　〕なり" + inputs配列
 */
export function parseQuestion(originalSentence: string): ParseResult {
  const inputs: KanjiInput[] = []
  let displaySentence = originalSentence

  // [漢字|読み]パターンを検索
  const pattern = /\[([^|]+)\|([^\]]+)\]/g
  let match: RegExpExecArray | null

  // 一時的な配列に全てのマッチを保存
  const matches: RegExpExecArray[] = []
  match = pattern.exec(originalSentence)
  while (match !== null) {
    matches.push({ ...match })
    match = pattern.exec(originalSentence)
  }

  // まず入力欄情報を順番に保存（複数文字の場合は一文字ずつ分割）
  let inputIndex = 0
  let groupId = 0
  matches.forEach((m) => {
    const kanjiChars = m[1].split('')
    const reading = m[2]
    const groupSize = kanjiChars.length

    // 複数文字の場合、各文字に対して入力欄を作成
    kanjiChars.forEach((kanji, charIndex) => {
      inputs.push({
        kanji: kanji,
        reading: charIndex === 0 ? reading : '', // 読みは最初の文字にのみ設定
        position: m.index + charIndex,
        index: inputIndex++,
        groupId: groupId,
        isGroupStart: charIndex === 0,
        groupSize: groupSize,
      })
    })
    groupId++
  })

  // 後ろから置換していく（インデックスがずれないように）
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i]
    const kanjiChars = m[1].split('')
    const startPos = m.index

    // 各文字に対して個別の入力欄を作成
    const placeholders = kanjiChars.map(() => '〔　〕').join('')
    displaySentence = displaySentence.substring(0, startPos) + placeholders + displaySentence.substring(startPos + m[0].length)
  }

  return {
    displaySentence,
    inputs,
  }
}

/**
 * 入力欄の幅を計算（文字数に基づく）
 */
export function calculateInputWidth(kanjiLength: number): number {
  // 1文字あたり約40px、最小80px
  return Math.max(80, kanjiLength * 40)
}

/**
 * 問題文を分割して、テキスト部分と入力欄部分に分ける
 */
export function splitDisplaySentence(displaySentence: string): Array<{ type: 'text' | 'input'; content: string; inputIndex?: number }> {
  const parts: Array<{ type: 'text' | 'input'; content: string; inputIndex?: number }> = []
  const inputPattern = /〔[　]+〕/g
  let lastIndex = 0
  let inputIndex = 0
  let match: RegExpExecArray | null

  match = inputPattern.exec(displaySentence)
  while (match !== null) {
    // 入力欄の前のテキスト
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: displaySentence.substring(lastIndex, match.index),
      })
    }

    // 入力欄
    parts.push({
      type: 'input',
      content: match[0],
      inputIndex: inputIndex++,
    })

    lastIndex = match.index + match[0].length
    match = inputPattern.exec(displaySentence)
  }

  // 最後のテキスト部分
  if (lastIndex < displaySentence.length) {
    parts.push({
      type: 'text',
      content: displaySentence.substring(lastIndex),
    })
  }

  return parts
}
