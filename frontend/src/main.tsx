import msalInstance from './config/msalConfig.ts'

import './instrumentation.ts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { initializeSentry } from './instrumentation'
import { MsalProvider } from '@azure/msal-react'
import { BrowserAuthErrorCodes } from '@azure/msal-browser'

initializeSentry()

const initializeApp = async () => {
  await msalInstance.initialize()

  try {
    const response = await msalInstance.handleRedirectPromise()

    if (response?.account) {
      msalInstance.setActiveAccount(response.account)
    } else {
      const accounts = msalInstance.getAllAccounts()

      if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0])
      }
    }
  } catch (err) {
    if (
      (err as { errorCode?: string }).errorCode !==
      BrowserAuthErrorCodes.noTokenRequestCacheError
    ) {
      console.error(err)
    }
  }

  createRoot(document.getElementById('main')!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </StrictMode>,
  )
}

initializeApp()
