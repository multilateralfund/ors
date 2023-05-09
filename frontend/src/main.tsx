import { Suspense, StrictMode } from 'react'
import * as ReactDOM from 'react-dom/client'
import { Flowbite } from 'flowbite-react'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { CookiesProvider } from 'react-cookie'
import { Provider } from 'react-redux'
import { store } from './store'
import { flowbiteTheme } from './theme'

import App from './App'

import './utils/i18n'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Flowbite theme={{ theme: flowbiteTheme }}>
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
    </Flowbite>
  </StrictMode>,
)
