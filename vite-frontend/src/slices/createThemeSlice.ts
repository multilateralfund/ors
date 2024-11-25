import type { CreateSliceProps } from '@ors/types/store'
import type { ThemeSlice } from '@ors/types/store'

import { produce } from 'immer'
import Cookies from 'js-cookie'

import config from '@ors/registry'

export const createThemeSlice = ({
  initialState,
  set,
}: CreateSliceProps): ThemeSlice => ({
  mode: initialState?.theme?.mode || null,
  setMode: (mode) => {
    set(
      produce((state) => {
        Cookies.set(config.cookies.theme, mode as string)
        state.theme.mode = mode
      }),
    )
  },
})
