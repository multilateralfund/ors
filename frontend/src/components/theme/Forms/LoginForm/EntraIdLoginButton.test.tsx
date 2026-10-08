import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { useMsal } from '@azure/msal-react'
import { useStore } from '@ors/store'
import { loginWithMsal } from '@ors/helpers/Api/msalLogin'
import EntraIdLoginButton from './EntraIdLoginButton'

vi.mock('@azure/msal-react', () => ({ useMsal: vi.fn() }))
vi.mock('@ors/store', () => ({ useStore: vi.fn() }))
vi.mock('@ors/helpers/Api/msalLogin', () => ({ loginWithMsal: vi.fn() }))
vi.mock('@ors/config/msalConfig', () => ({
  hasMsalConfig: true,
  scopes: ['api/.default'],
}))

const account = { homeAccountId: 'signed-in-user' }
const instance = {
  getActiveAccount: vi.fn(),
  getAllAccounts: vi.fn(),
  setActiveAccount: vi.fn(),
  loginRedirect: vi.fn(),
}
const getUser = vi.fn()

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useMsal).mockReturnValue({ instance } as any)
  vi.mocked(useStore).mockReturnValue({ getUser } as any)
  instance.getActiveAccount.mockReturnValue(account)
  instance.getAllAccounts.mockReturnValue([])
  getUser.mockResolvedValue({ pk: 123 })
  vi.mocked(loginWithMsal).mockResolvedValue(true)
  window.history.replaceState(
    {},
    '',
    '/login?redirect=%2Fapi%2Fprojects%2Fv2%2Fexport%2F',
  )
})

afterEach(() => {
  window.history.replaceState({}, '', '/')
})

describe('Microsoft sign in for a redirected download', () => {
  it('establishes backend cookies before marking the user signed in', async () => {
    render(<EntraIdLoginButton />)
    fireEvent.click(
      screen.getByAltText('Sign in with UN System Organization account'),
    )
    await waitFor(() => expect(getUser).toHaveBeenCalledOnce())
    expect(loginWithMsal).toHaveBeenCalledOnce()
    expect(vi.mocked(loginWithMsal).mock.invocationCallOrder[0]).toBeLessThan(
      getUser.mock.invocationCallOrder[0],
    )
  })

  it('preserves the return URL through an interactive MSAL redirect', async () => {
    instance.getActiveAccount.mockReturnValue(null)
    instance.getAllAccounts.mockReturnValue([])
    render(<EntraIdLoginButton />)
    fireEvent.click(
      screen.getByAltText('Sign in with UN System Organization account'),
    )
    await waitFor(() =>
      expect(instance.loginRedirect).toHaveBeenCalledWith({
        scopes: ['api/.default'],
        redirectStartPage: window.location.href,
      }),
    )
    expect(loginWithMsal).not.toHaveBeenCalled()
  })

  it('asks for interaction if silent MSAL acquisition is unavailable', async () => {
    vi.mocked(loginWithMsal).mockRejectedValue(
      new InteractionRequiredAuthError('interaction_required'),
    )
    render(<EntraIdLoginButton />)
    fireEvent.click(
      screen.getByAltText('Sign in with UN System Organization account'),
    )
    await waitFor(() => expect(instance.loginRedirect).toHaveBeenCalledOnce())
    expect(getUser).not.toHaveBeenCalled()
  })
})
