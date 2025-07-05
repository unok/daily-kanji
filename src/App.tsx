import { Provider } from 'jotai'

import { GameController } from './components/GameController'

function App() {
  return (
    <Provider>
      <GameController />
    </Provider>
  )
}

export default App
