import type { CreateSliceProps } from '@ors/types/store'
import type { HeaderSlice } from '@ors/types/store'

import { produce } from 'immer'
import resolveConfig from 'tailwindcss/resolveConfig'

import tailwindConfigModule from '~/tailwind.config'

const tailwindConfig = resolveConfig(tailwindConfigModule)

export const createHeaderSlice = ({
  initialState,
  set,
}: CreateSliceProps): HeaderSlice => {
  const initialTheme = initialState?.theme?.mode || 'light'
  const initialNavigationBackground =
    tailwindConfig.originalColors[initialTheme].primary.DEFAULT

  return {
    HeaderTitle: null,
    navigationBackground: initialNavigationBackground,
    setHeaderTitleComponent: (component) => {
      set(
        produce((state) => {
          state.header.HeaderTitle = component || null
        }),
      )
    },
    setNavigationBackground: (value) => {
      set(
        produce((state) => {
          state.header.navigationBackground =
            value || initialNavigationBackground
        }),
      )
    },
  }
}
