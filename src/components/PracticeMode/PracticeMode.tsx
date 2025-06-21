import { useState } from 'react'

import { WritingCanvas } from '../WritingCanvas'

interface PracticeModeProps {
  kanji: string
  onComplete: () => void
}

export function PracticeMode({ kanji, onComplete }: PracticeModeProps) {
  const [practiceCount, setPracticeCount] = useState(0)
  const [writtenImages, setWrittenImages] = useState<string[]>([])

  const handleImageCapture = (imageData: string) => {
    setWrittenImages([...writtenImages, imageData])
    setPracticeCount(practiceCount + 1)

    if (practiceCount + 1 >= 5) {
      // 5回練習完了
      setTimeout(onComplete, 1000)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">「{kanji}」を5回練習してください</h2>

      <div className="mb-6 text-center">
        <div className="text-6xl font-bold mb-4">{kanji}</div>
        <p className="text-lg text-gray-600">練習回数: {practiceCount} / 5</p>
      </div>

      {practiceCount < 5 ? (
        <WritingCanvas onImageCapture={handleImageCapture} />
      ) : (
        <div className="text-center py-8">
          <p className="text-2xl font-bold text-green-600 mb-4">練習完了！</p>
          <p className="text-gray-600">次の漢字に進みます...</p>
        </div>
      )}

      {writtenImages.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">練習履歴</h3>
          <div className="flex gap-2 overflow-x-auto">
            {writtenImages.map((img) => (
              <img key={img} src={img} alt="練習" className="w-20 h-20 border border-gray-300 rounded" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
