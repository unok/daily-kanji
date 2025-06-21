// Gemini Nano API の型定義
declare global {
  interface Window {
    ai?: {
      languageModel?: {
        capabilities?: () => Promise<{ available: 'readily' | 'after-download' | 'no' }>
        create?: (options?: { systemPrompt?: string }) => Promise<{
          prompt: (text: string) => Promise<string>
          destroy: () => void
        }>
      }
    }
  }
}

export {}
