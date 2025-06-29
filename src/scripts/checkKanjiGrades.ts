#!/usr/bin/env node

import { EDUCATION_KANJI } from '../data/kanji-lists/education-kanji'

const testKanji = [
  '囲',
  '胃',
  '毒',
  '費',
  '型',
  '紀',
  '喜',
  '救',
  '粉',
  '脈',
  '歴',
  '竿',
  '航',
  '告',
  '殺',
  '士',
  '史',
  '象',
  '賞',
  '貯',
  '腸',
  '停',
  '堂',
  '得',
]

console.log('漢字の学年確認:')
console.log('================================================================================')

testKanji.forEach((kanji) => {
  let found = false
  for (let grade = 1; grade <= 6; grade++) {
    const gradeKanji = EDUCATION_KANJI[grade as keyof typeof EDUCATION_KANJI] || []
    if (gradeKanji.includes(kanji)) {
      console.log(`${kanji}: ${grade}年生`)
      found = true
      break
    }
  }
  if (!found) {
    console.log(`${kanji}: 小学校範囲外`)
  }
})

console.log('\n4年生の漢字一覧:')
console.log(EDUCATION_KANJI[4].join(' '))
