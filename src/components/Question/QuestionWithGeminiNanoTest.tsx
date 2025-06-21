import { useEffect, useState } from 'react'
/// <reference path="../../types/gemini.d.ts" />

export function GeminiNanoTest() {
  const [status, setStatus] = useState<string>('確認中...')
  const [details, setDetails] = useState<{
    error?: string
    capabilities?: { available: string }
    capError?: string
    testResult?: string
    createSuccess?: boolean
    createError?: string
    generalError?: string
  } | null>(null)

  useEffect(() => {
    const checkGeminiNano = async () => {
      try {
        // 1. window.ai の存在確認
        if (!('ai' in window)) {
          setStatus('❌ window.ai が存在しません')
          setDetails({ error: 'window.ai not found' })
          return
        }

        // 2. languageModel の確認
        if (!window.ai?.languageModel) {
          setStatus('❌ window.ai.languageModel が存在しません')
          setDetails({ error: 'languageModel not found' })
          return
        }

        // 3. capabilities の確認
        if (!window.ai.languageModel.capabilities) {
          setStatus('❌ capabilities メソッドが存在しません')
          setDetails({ error: 'capabilities method not found' })
          return
        }

        // 4. 実際に capabilities を呼び出す
        try {
          const caps = await window.ai.languageModel.capabilities()
          setDetails({ capabilities: caps })

          if (caps.available === 'readily') {
            setStatus('✅ Gemini Nano は利用可能です！')
          } else if (caps.available === 'after-download') {
            setStatus('⏳ Gemini Nano はダウンロード後に利用可能です')
          } else {
            setStatus('❌ Gemini Nano は利用できません')
          }
        } catch (capError) {
          setStatus('❌ capabilities の呼び出しでエラー')
          setDetails({ capError: (capError as Error).message })
        }

        // 5. create メソッドの確認
        if (window.ai.languageModel.create) {
          try {
            const session = await window.ai.languageModel.create()
            const testResult = await session.prompt('こんにちは')
            setDetails((prev) => ({ ...prev, testResult, createSuccess: true }))
            session.destroy()
          } catch (createError) {
            setDetails((prev) => ({ ...prev, createError: (createError as Error).message }))
          }
        }
      } catch (error) {
        setStatus('❌ エラーが発生しました')
        setDetails({ generalError: (error as Error).message })
      }
    }

    checkGeminiNano()
  }, [])

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Gemini Nano 診断ツール</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">ステータス:</h3>
        <p className="text-xl">{status}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">詳細情報:</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">{JSON.stringify(details, null, 2)}</pre>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">設定手順:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Chrome Canary (バージョン128.0.6545.0以降) を使用</li>
          <li>
            <code className="bg-gray-200 px-1">chrome://flags/#optimization-guide-on-device-model</code>
            <br />→ 「Enabled BypassPerfRequirement」に設定
          </li>
          <li>
            <code className="bg-gray-200 px-1">chrome://flags/#prompt-api-for-gemini-nano</code>
            <br />→ 「Enabled」に設定
          </li>
          <li>Chrome を完全に再起動（すべてのウィンドウを閉じて再度開く）</li>
          <li>
            もし上記でダメな場合：
            <br />• <code className="bg-gray-200 px-1">chrome://flags/#translation-api</code> も「Enabled」に
            <br />• デバイスに十分なストレージ容量があることを確認（2GB以上推奨）
          </li>
        </ol>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">代替手段:</h3>
        <p className="text-sm text-gray-600">Gemini Nano が使えない場合は、別の認識方法に切り替えることをお勧めします。</p>
      </div>

      <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        再読み込み
      </button>
    </div>
  )
}
