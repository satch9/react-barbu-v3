import React from 'react'
import ReactDOM from 'react-dom'
import App from './App.tsx'
import './index.css'
import { SocketContextProvider } from './context/SocketContext.tsx'
import { GameContextProvider } from './context/GameContext.tsx'

ReactDOM.render(
  <React.StrictMode>
    <SocketContextProvider>
      <GameContextProvider>
        <App />
      </GameContextProvider>
    </SocketContextProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
