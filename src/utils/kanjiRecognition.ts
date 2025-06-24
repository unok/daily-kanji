/**
 * 手書き漢字認識ユーティリティ
 * 複数フォントで正解漢字を描画し、手書き文字との類似度を計算
 */

// 使用するフォントのリスト
const FONT_LIST = [
  '"Hiragino Sans", "Meiryo", sans-serif', // ゴシック体
  '"Hiragino Mincho", "MS Mincho", serif', // 明朝体
  '"Klee", "Comic Sans MS", cursive', // 手書き風
  '"Yu Gothic", "Meiryo", sans-serif', // 游ゴシック
  'serif', // 標準セリフ体
]

interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

interface SimilarityResult {
  f1Score: number
  precision: number
  recall: number
  matchingPixels: number
  userPixels: number
  refPixels: number
}

/**
 * 画像の境界ボックスを取得
 */
function getBoundingBox(imageData: ImageData): BoundingBox {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height

  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      if (data[idx + 3] > 50) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

/**
 * 正規化されたキャンバスに描画
 */
function drawNormalizedImage(sourceCanvas: HTMLCanvasElement, targetCanvas: HTMLCanvasElement, boundingBox: BoundingBox): ImageData {
  const targetCtx = targetCanvas.getContext('2d')
  if (!targetCtx) throw new Error('Failed to get 2D context')
  targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height)

  if (boundingBox.width > 0 && boundingBox.height > 0) {
    // 縦横比を保持しながら、キャンバスの90%のサイズに拡大
    // 0.9にすることで、端の判定を改善
    const scale = Math.min((targetCanvas.width * 0.9) / boundingBox.width, (targetCanvas.height * 0.9) / boundingBox.height)

    const scaledWidth = boundingBox.width * scale
    const scaledHeight = boundingBox.height * scale
    const offsetX = (targetCanvas.width - scaledWidth) / 2
    const offsetY = (targetCanvas.height - scaledHeight) / 2

    targetCtx.drawImage(sourceCanvas, boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height, offsetX, offsetY, scaledWidth, scaledHeight)
  }

  return targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height)
}

/**
 * 正解の漢字を指定フォントで描画
 */
function drawReferenceKanjiWithFont(kanji: string, fontFamily: string): HTMLCanvasElement {
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = 250
  tempCanvas.height = 250
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) throw new Error('Failed to get 2D context')

  tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)

  tempCtx.font = `bold 200px ${fontFamily}`
  tempCtx.textAlign = 'center'
  tempCtx.textBaseline = 'middle'
  tempCtx.fillStyle = '#000'
  tempCtx.fillText(kanji, tempCanvas.width / 2, tempCanvas.height / 2)

  tempCtx.strokeStyle = '#000'
  tempCtx.lineWidth = 3
  tempCtx.strokeText(kanji, tempCanvas.width / 2, tempCanvas.height / 2)

  return tempCanvas
}

/**
 * データURLからキャンバスを作成
 */
function createCanvasFromDataUrl(dataUrl: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to get 2D context')
      ctx.drawImage(img, 0, 0)
      resolve(canvas)
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * 単一フォントとの類似度を計算
 */
function calculateSimilarityWithFont(userCanvas: HTMLCanvasElement, userBBox: BoundingBox, kanji: string, fontFamily: string): SimilarityResult {
  const refCanvas = drawReferenceKanjiWithFont(kanji, fontFamily)
  const refCtx = refCanvas.getContext('2d')
  if (!refCtx) throw new Error('Failed to get 2D context')
  const refImageData = refCtx.getImageData(0, 0, refCanvas.width, refCanvas.height)
  const refBBox = getBoundingBox(refImageData)

  const normalizedSize = 100
  const userNormCanvas = document.createElement('canvas')
  const refNormCanvas = document.createElement('canvas')
  userNormCanvas.width = userNormCanvas.height = normalizedSize
  refNormCanvas.width = refNormCanvas.height = normalizedSize

  const normalizedUserData = drawNormalizedImage(userCanvas, userNormCanvas, userBBox)
  const normalizedRefData = drawNormalizedImage(refCanvas, refNormCanvas, refBBox)

  const userData = normalizedUserData.data
  const refData = normalizedRefData.data

  let matchingPixels = 0
  let userPixels = 0
  let refPixels = 0
  let userOnlyPixels = 0 // ユーザーだけが描いた部分（余分な部分）

  const width = normalizedSize
  const height = normalizedSize

  // 各ピクセルをチェック
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const userAlpha = userData[idx + 3]

      // 周囲のピクセルも確認（位置のずれを許容）
      let refAlpha = refData[idx + 3]

      // 2ピクセルのずれを許容（線が太くなったため）
      const tolerance = 2
      for (let dy = -tolerance; dy <= tolerance && refAlpha <= 50; dy++) {
        for (let dx = -tolerance; dx <= tolerance && refAlpha <= 50; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nidx = (ny * width + nx) * 4
            refAlpha = Math.max(refAlpha, refData[nidx + 3])
          }
        }
      }

      if (userAlpha > 50 && refAlpha > 50) {
        matchingPixels++
      } else if (userAlpha > 50 && refAlpha <= 50) {
        userOnlyPixels++ // 余分な部分をカウント
      }

      if (userAlpha > 50) userPixels++
    }
  }

  // 正解のピクセル数を別途カウント
  for (let i = 0; i < refData.length; i += 4) {
    if (refData[i + 3] > 50) refPixels++
  }

  if (userPixels === 0) {
    return { f1Score: 0, precision: 0, recall: 0, matchingPixels: 0, userPixels: 0, refPixels: 0 }
  }

  // 改善された精度計算
  // 1. 基本の適合率（描いた部分のうち正解と重なる割合）
  const basePrecision = matchingPixels / userPixels

  // 2. 余分な部分のペナルティ（余分な部分が多いほど大きくペナルティ）
  const extraPenalty = userOnlyPixels / (matchingPixels + 1) // +1は0除算防止
  const penaltyFactor = Math.exp(-extraPenalty * 0.5) // 指数関数的にペナルティを適用

  // 3. 最終的な適合率
  const precision = basePrecision * penaltyFactor

  // 4. 再現率（正解の漢字のうちカバーできた割合）
  const recall = refPixels > 0 ? matchingPixels / refPixels : 0

  // 5. F1スコア（適合率と再現率の調和平均）
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0

  return { f1Score, precision, recall, matchingPixels, userPixels, refPixels }
}

/**
 * 手書き文字と正解漢字の類似度を計算
 * @param canvasDataUrl 手書きキャンバスのData URL
 * @param expectedKanji 正解の漢字
 * @returns 類似度スコア (0-1)
 */
export async function recognizeKanji(canvasDataUrl: string, expectedKanji: string): Promise<number> {
  try {
    // 空のキャンバスの場合
    if (!canvasDataUrl || canvasDataUrl === 'data:,') {
      return 0
    }

    const userCanvas = await createCanvasFromDataUrl(canvasDataUrl)
    const userCtx = userCanvas.getContext('2d')
    if (!userCtx) throw new Error('Failed to get 2D context')
    const userImageData = userCtx.getImageData(0, 0, userCanvas.width, userCanvas.height)
    const userBBox = getBoundingBox(userImageData)

    // 何も描かれていない場合
    if (userBBox.width <= 0 || userBBox.height <= 0) {
      return 0
    }

    let bestScore = 0

    // 各フォントで類似度を計算し、最高値を採用
    for (const font of FONT_LIST) {
      const result = calculateSimilarityWithFont(userCanvas, userBBox, expectedKanji, font)
      if (result.f1Score > bestScore) {
        bestScore = result.f1Score
      }
    }

    return bestScore
  } catch (error) {
    console.error('Kanji recognition error:', error)
    return 0
  }
}

/**
 * デバッグ情報付きで類似度を計算
 */
export async function recognizeKanjiWithDebug(
  canvasDataUrl: string,
  expectedKanji: string
): Promise<{
  bestScore: number
  results: Array<{
    font: string
    f1Score: number
    precision: number
    recall: number
    isBest: boolean
  }>
}> {
  try {
    if (!canvasDataUrl || canvasDataUrl === 'data:,') {
      return { bestScore: 0, results: [] }
    }

    const userCanvas = await createCanvasFromDataUrl(canvasDataUrl)
    const userCtx = userCanvas.getContext('2d')
    if (!userCtx) throw new Error('Failed to get 2D context')
    const userImageData = userCtx.getImageData(0, 0, userCanvas.width, userCanvas.height)
    const userBBox = getBoundingBox(userImageData)

    if (userBBox.width <= 0 || userBBox.height <= 0) {
      return { bestScore: 0, results: [] }
    }

    let bestScore = 0
    const results: Array<{
      font: string
      f1Score: number
      precision: number
      recall: number
      isBest: boolean
    }> = []

    for (const font of FONT_LIST) {
      const result = calculateSimilarityWithFont(userCanvas, userBBox, expectedKanji, font)
      const fontName = font.split(',')[0].replace(/"/g, '')
      results.push({
        font: fontName,
        f1Score: result.f1Score,
        precision: result.precision,
        recall: result.recall,
        isBest: false,
      })

      if (result.f1Score > bestScore) {
        bestScore = result.f1Score
      }
    }

    // 最高スコアのフォントにフラグを設定
    const bestIndex = results.findIndex((r) => r.f1Score === bestScore)
    if (bestIndex >= 0) {
      results[bestIndex].isBest = true
    }

    return { bestScore, results }
  } catch (error) {
    console.error('Kanji recognition error:', error)
    return { bestScore: 0, results: [] }
  }
}
