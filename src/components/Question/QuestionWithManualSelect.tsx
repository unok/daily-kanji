import { useCallback, useState } from 'react'

import type { Question as QuestionType } from '../../atoms/gameAtoms'
import { WritingCanvas } from '../WritingCanvas'

interface QuestionProps {
  question: QuestionType
  onAnswer: (answer: string) => void
}

export function Question({ question, onAnswer }: QuestionProps) {
  const [_canvasId, setCanvasId] = useState<string>('')
  const [showCandidates, setShowCandidates] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)

  // 正解の漢字と似た漢字の候補を用意（正解を含まない）
  const generateCandidates = (correctAnswer: string): string[] => {
    const allCandidates: { [key: string]: string[] } = {
      日: ['目', '口', '回', '田', '白'],
      月: ['用', '円', '目', '肉', '用'],
      火: ['大', '人', '木', '水', '灯'],
      水: ['氷', '永', '木', '火', '汁'],
      木: ['本', '大', '太', '林', '禾'],
      金: ['全', '今', '令', '会', '銀'],
      土: ['士', '工', '王', '主', '生'],
      山: ['出', '凸', '屮', '峰', '岳'],
      川: ['小', '少', '水', '州', '河'],
      田: ['由', '甲', '申', '日', '畑'],
      人: ['入', '八', '大', '夫', '介'],
      口: ['日', '目', '回', '品', '呂'],
      目: ['日', '月', '見', '貝', '自'],
      耳: ['目', '見', '聞', '取', '身'],
      手: ['毛', '友', '支', '扌', '才'],
      足: ['定', '走', '促', '是', '疋'],
      見: ['目', '覚', '視', '観', '貝'],
      音: ['言', '立', '暗', '闇', '意'],
      力: ['刀', '九', '丸', '方', '功'],
      気: ['汽', '氣', '風', '雲', '気'],
      円: ['月', '用', '内', '冊', '丸'],
      入: ['人', '八', '込', '久', '内'],
      出: ['山', '凸', '屮', '生', '出'],
      立: ['音', '位', '章', '童', '辛'],
      休: ['体', '伏', '付', '侍', '休'],
      先: ['洗', '光', '兆', '充', '失'],
      夕: ['外', '多', '汐', '夜', '名'],
      本: ['木', '体', '末', '未', '大'],
      文: ['交', '父', '支', '攵', '又'],
      字: ['学', '守', '宇', '安', '宗'],
      学: ['字', '覚', '党', '掌', '宇'],
      校: ['交', '較', '郊', '効', '格'],
      村: ['材', '林', '杯', '枚', '付'],
      町: ['丁', '打', '灯', '汀', '庁'],
      森: ['林', '木', '杜', '樹', '禾'],
      正: ['止', '生', '主', '王', '証'],
      天: ['大', '太', '夫', '犬', '矢'],
      雨: ['雪', '電', '雲', '零', '雷'],
      花: ['化', '華', '草', '茶', '芝'],
      草: ['花', '芝', '茶', '若', '艸'],
      虫: ['風', '虹', '蚊', '蛇', '中'],
      犬: ['大', '太', '天', '戌', '大'],
      赤: ['亦', '変', '恋', '六', '朱'],
      青: ['清', '晴', '精', '請', '靑'],
      白: ['日', '目', '自', '百', '臼'],
      // 複数文字の場合
      学校: ['学生', '学習', '小学', '中学', '高校'],
      先生: ['学生', '生徒', '教師', '先輩', '師匠'],
    }

    const candidates = allCandidates[correctAnswer] || ['一', '二', '三', '四', '五']

    // 正解を含めた候補を作成し、シャッフル
    const allOptions = [...candidates.slice(0, 4), correctAnswer]
    return allOptions.sort(() => Math.random() - 0.5)
  }

  const handleCanvasReady = useCallback((id: string) => {
    setCanvasId(id)
  }, [])

  const handleImageCapture = () => {
    setShowCandidates(true)
  }

  const handleCandidateSelect = (candidate: string) => {
    setSelectedCandidate(candidate)
  }

  const handleSubmit = () => {
    if (selectedCandidate) {
      onAnswer(selectedCandidate)
      // キャンバスをクリア
      setShowCandidates(false)
      setSelectedCandidate(null)
    }
  }

  // 実際は手書き認識をせず、正解ベースの候補を表示
  // TODO: 手書き認識機能を実装する場合はここを修正
  const candidates = generateCandidates(question.answer)

  // 問題文をパースして、ふりがな付きの空欄を表示
  const renderQuestionWithFurigana = () => {
    const sentence = question.sentence
    const match = sentence.match(/(.*)〔(.*)〕(.*)/)

    if (match) {
      const [, before, blank, after] = match
      const blankLength = blank.length

      return (
        <div className="text-2xl font-bold text-center leading-loose">
          <span>{before}</span>
          <span className="inline-block relative mx-1 align-bottom">
            <span className="text-sm text-red-500 font-medium absolute -top-7 left-0 right-0 text-center whitespace-nowrap">{question.hint}</span>
            <span className="inline-block border-b-2 border-gray-600 px-2 pb-1" style={{ minWidth: `${blankLength * 1.5}em` }}>
              {Array(blankLength).fill('　').join('')}
            </span>
          </span>
          <span>{after}</span>
        </div>
      )
    }

    return <div className="text-2xl font-bold text-center">{sentence}</div>
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8 mt-4">{renderQuestionWithFurigana()}</div>

      <WritingCanvas
        onImageCapture={handleImageCapture}
        onCanvasReady={handleCanvasReady}
        key={`canvas-${question.id}`} // 問題が変わったらキャンバスを再生成
      />

      {showCandidates && (
        <div className="mt-6">
          <p className="text-center mb-4 text-gray-700">書いた文字に最も近いものを選んでください：</p>
          <div className="grid grid-cols-5 gap-2">
            {candidates.map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => handleCandidateSelect(candidate)}
                className={`p-4 text-2xl font-bold rounded-lg transition-all ${
                  selectedCandidate === candidate ? 'bg-blue-500 text-white transform scale-110' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {candidate}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedCandidate && (
        <div className="mt-4 text-center">
          <p className="text-lg mb-2">選択した文字: {selectedCandidate}</p>
          <button type="button" onClick={handleSubmit} className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
            回答する
          </button>
        </div>
      )}
    </div>
  )
}
