import './instrumentation.ts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { loadRuntimeConfig } from './config/base'
import { initializeSentry } from './instrumentation'

createRoot(document.getElementById('main')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

loadRuntimeConfig()
  .then(() => {
    initializeSentry()
  })
  .catch(err => {
    console.warn('Failed to initialize Sentry:', err)
  })
