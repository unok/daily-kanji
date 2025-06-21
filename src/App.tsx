import { Provider } from 'jotai'

import { GameController } from './components/GameController'
import { TestGemini } from './components/TestGemini'

function App() {
  // Gemini Nano のテスト用（URLに ?test=gemini を含む場合）
  const urlParams = new URLSearchParams(window.location.search)
  const isGeminiTest = urlParams.get('test') === 'gemini'

  return <Provider>{isGeminiTest ? <TestGemini /> : <GameController />}</Provider>
}

export default App
