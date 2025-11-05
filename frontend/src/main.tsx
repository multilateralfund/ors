import './instrumentation.ts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { loadRuntimeConfig } from './config/base'
import { initializeSentry } from './instrumentation'

loadRuntimeConfig()
  .then(() => {
    initializeSentry()
  })
  .finally(() => {
    createRoot(document.getElementById('main')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
