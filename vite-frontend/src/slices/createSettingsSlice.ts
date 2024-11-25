import type { CreateSliceProps } from '@ors/types/store'
import { SettingsSlice } from '@ors/types/store'

export const createSettingsSlice = ({
  initialState,
}: CreateSliceProps): SettingsSlice => {
  const { host, protocol } = initialState.settings || {}

  return {
    host: host || import.meta.env.VITE_PUBLIC_HOST || null,
    protocol: protocol || import.meta.env.VITE_PUBLIC_PROTOCOL || null,
  }
}
