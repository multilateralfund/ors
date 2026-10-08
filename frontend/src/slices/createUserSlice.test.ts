import { describe, expect, it, vi } from 'vitest'

import { setSlice } from '@ors/helpers/Store/Store'
import { createUserSlice } from './createUserSlice'

vi.mock('@ors/helpers/Store/Store', () => ({
  getInitialSliceData: () => ({ data: null, loaded: false, loading: false }),
  setSlice: vi.fn(),
}))
vi.mock('@ors/helpers/Api/_api', () => ({ default: vi.fn() }))
vi.mock('@ors/config/msalConfig', () => ({ default: {} }))

describe('user slice', () => {
  it('makes a failed MSAL exchange visible on the login page', () => {
    const user = createUserSlice({ initialState: {} } as any)
    user.msalLoginFailed()

    expect(setSlice).toHaveBeenCalledWith('user', {
      data: null,
      loaded: true,
      loading: false,
      error: {
        non_field_errors: ['Microsoft sign in failed. Please try again.'],
      },
    })
  })
})
