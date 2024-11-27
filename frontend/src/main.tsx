import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('next-app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
