import MicrosoftLogo from './MicrosoftLogo.svg'
import { scopes } from '@ors/config/msalConfig'

import { enqueueSnackbar } from 'notistack'
import { useMsal } from '@azure/msal-react'
import { Button } from '@mui/material'

const EntraIdLoginButton = () => {
  const { instance } = useMsal()

  const handleLogin = async () => {
    try {
      const account =
        instance.getActiveAccount() || instance.getAllAccounts()[0]

      if (account) {
        instance.setActiveAccount(account)
        return
      }

      await instance.loginRedirect({ scopes })
    } catch (err) {
      enqueueSnackbar(
        <>An error occurred during sign in. Please try again.</>,
        { variant: 'error' },
      )
    }
  }

  return (
    <Button
      variant="contained"
      className="mx-auto mt-3 h-9 w-fit gap-3 border border-solid border-[#d1d1d1] bg-white px-3 py-1.5 text-lg normal-case text-[#5E5E5E]"
      onClick={handleLogin}
    >
      <img
        src={MicrosoftLogo}
        alt="Microsoft logo"
        style={{ width: 20, height: 20 }}
      />
      <span className="mt-0.5">Sign in with Microsoft</span>
    </Button>
  )
}

export default EntraIdLoginButton
