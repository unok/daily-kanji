# Windowsでの無料文字認識オプション

## 1. Windows.Media.Ocr API (UWP)
- **利点**: Windows 10/11に組み込み、完全無料、日本語対応
- **欠点**: UWPアプリまたはWinRT経由でのみ使用可能
- **実装方法**: 
  - Electron + Node.js で WinRT を使用
  - WebView2 経由でアクセス
  - C#/.NET でAPIサーバーを作成

## 2. Microsoft Office の手書き認識
- **利点**: Office がインストールされていれば無料で使用可能
- **欠点**: Office が必要、COM経由でのアクセス
- **実装方法**: Node.js + win32ole または Edge WebView2

## 3. Windows Ink API
- **利点**: 手書き入力に特化、Windows標準機能
- **欠点**: アプリケーション開発が必要
- **実装方法**: WPF/UWP アプリケーション

## 4. ローカルサーバー方式
Electronアプリやローカルサーバーを立てて、ブラウザと通信する方法：

```javascript
// Electron メインプロセスの例
const { app, BrowserWindow, ipcMain } = require('electron')
const { WindowsOcr } = require('windows-ocr') // 仮想的なパッケージ

ipcMain.handle('recognize-kanji', async (event, imageData) => {
  // Windows OCR APIを使用
  const result = await WindowsOcr.recognize(imageData, 'ja-JP')
  return result
})
```

## 5. Python + Windows OCR
Pythonサーバーを立てて、ブラウザからAPIとして使用：

```python
# Python サーバーの例
from flask import Flask, request, jsonify
import asyncio
from PIL import Image
import io
import base64

# Windows.Media.Ocr を Python から使用
import winrt
from winrt.windows.media.ocr import OcrEngine
from winrt.windows.graphics.imaging import SoftwareBitmap

app = Flask(__name__)

@app.route('/recognize', methods=['POST'])
async def recognize():
    image_data = request.json['image']
    # Base64デコード
    image_bytes = base64.b64decode(image_data.split(',')[1])
    
    # Windows OCR で認識
    engine = OcrEngine.try_create_from_language(winrt.windows.globalization.Language("ja-JP"))
    # ... 認識処理 ...
    
    return jsonify({'text': recognized_text})
```

## 6. PWA + Web Share Target API
PWAとして実装し、他のWindowsアプリと連携：

```javascript
// manifest.json
{
  "share_target": {
    "action": "/recognize",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "files": [{
        "name": "image",
        "accept": ["image/*"]
      }]
    }
  }
}
```

## 7. WebAssembly + Tesseract
ブラウザ内で完結するが、精度は低い：

```javascript
import Tesseract from 'tesseract.js'

const recognize = async (imageData) => {
  const result = await Tesseract.recognize(
    imageData,
    'jpn',
    {
      logger: m => console.log(m)
    }
  )
  return result.data.text
}
```

## 推奨アプローチ

### A. Electron アプリとして配布
- 最も確実で高精度
- Windows OCR API を直接使用可能
- オフラインで動作

### B. ローカル Python サーバー
- 開発が簡単
- ブラウザはそのまま使える
- pip install で簡単にセットアップ

### C. Chrome 拡張機能
- Chrome の実験的 API を使用
- 配布が簡単
- 将来的に標準化される可能性

## 実装例：Electron + Windows OCR

```javascript
// main.js (Electron メインプロセス)
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

// Windows Runtime を初期化
const { init } = require('winrt')
init()

const { OcrEngine, Language } = require('winrt').windows.media.ocr
const { SoftwareBitmap } = require('winrt').windows.graphics.imaging

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })
  
  mainWindow.loadFile('index.html')
}

ipcMain.handle('recognize-handwriting', async (event, imageDataUrl) => {
  try {
    // 画像データを処理
    const base64Data = imageDataUrl.split(',')[1]
    const imageBuffer = Buffer.from(base64Data, 'base64')
    
    // Windows OCR エンジンを作成
    const ocrEngine = OcrEngine.tryCreateFromLanguage(new Language('ja-JP'))
    
    // 画像を SoftwareBitmap に変換
    // ... 変換処理 ...
    
    // OCR 実行
    const ocrResult = await ocrEngine.recognizeAsync(softwareBitmap)
    
    // テキストを抽出
    const text = ocrResult.text
    
    return { success: true, text }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

app.whenReady().then(createWindow)
```

これらの方法なら、Windowsで無料で日本語手書き文字認識が可能です。