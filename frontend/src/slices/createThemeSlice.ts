import type { ThemeSlice } from '@ors/types/store'

import { produce } from 'immer'
import Cookies from 'js-cookie'

import config from '@ors/registry'
import { CreateSliceProps } from '@ors/store'

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
