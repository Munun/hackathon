import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app.tsx'
import { WalletContextProvider } from './components/WalletContextProvider'
import { SolanaProvider } from './components/SolanaContext' // ← ADD THIS
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletContextProvider>
      {/* ← WRAP YOUR APP WITH SolanaProvider */}
      <SolanaProvider>
        <App />
      </SolanaProvider>
    </WalletContextProvider>
  </React.StrictMode>,
)