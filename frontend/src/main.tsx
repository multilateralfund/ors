import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { CookiesProvider } from 'react-cookie'
import { Provider } from 'react-redux'
import { store } from './store'

import App from './App'

import './utils/i18n'

import './index.css'
import 'react-toastify/dist/ReactToastify.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <CookiesProvider>
          <Suspense fallback="...is loading">
            <App />
          </Suspense>
          <ToastContainer />
        </CookiesProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
