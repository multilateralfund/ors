import { hasMsalConfig, scopes } from '@ors/config/msalConfig'
import { loginWithMsal } from '@ors/helpers/Api/msalLogin'
import UNSigninButton from './un-signin-button-6.png'

import { enqueueSnackbar } from 'notistack'
import { useMsal } from '@azure/msal-react'
import { InteractionRequiredAuthError } from '@azure/msal-browser'
import cx from 'classnames'
import { useStore } from '@ors/store'

const EntraIdLoginButton = () => {
  const { instance } = useMsal()
  const user = useStore((state) => state.user)

  const handleLogin = async () => {
    try {
      const account =
        instance.getActiveAccount() || instance.getAllAccounts()[0]

      if (account) {
        instance.setActiveAccount(account)
        await loginWithMsal()

        const apiUser = await user.getUser()

        if (!apiUser) {
          enqueueSnackbar(
            <>An error occurred during sign in. Please try again.</>,
            { variant: 'error' },
          )
        }

        return
      }

      await instance.loginRedirect({
        scopes,
        redirectStartPage: window.location.href,
      })
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        await instance.loginRedirect({
          scopes,
          redirectStartPage: window.location.href,
        })
        return
      }
      enqueueSnackbar(
        <>An error occurred during sign in. Please try again.</>,
        { variant: 'error' },
      )
    }
  }

  return (
    <img
      src={UNSigninButton}
      alt="Sign in with UN System Organization account"
      style={{ width: '100%' }}
      onClick={handleLogin}
      className={cx('mt-3 cursor-pointer', {
        'pointer-events-none opacity-50': !hasMsalConfig,
      })}
    />
  )
}

export default EntraIdLoginButton
