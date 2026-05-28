import {
  PublicClientApplication,
  type Configuration,
} from '@azure/msal-browser'

const CLIENT_ID = import.meta.env.VITE_FRONTEND_CLIENT_ID
const TENANT_ID = import.meta.env.VITE_TENANT_ID
const APPLICATION_ID_URI = import.meta.env.VITE_APPLICATION_ID_URI

export const scopes = [`${APPLICATION_ID_URI}/.default`]

export const hasMsalConfig = !!CLIENT_ID && !!TENANT_ID && !!APPLICATION_ID_URI

const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
  },
}

const msalInstance = new PublicClientApplication(msalConfig)

export default msalInstance
