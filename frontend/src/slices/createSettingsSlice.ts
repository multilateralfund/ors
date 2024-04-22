import type { CreateSliceProps } from '@ors/types/store'
import { SettingsSlice } from '@ors/types/store'

export const createSettingsSlice = ({
  initialState,
}: CreateSliceProps): SettingsSlice => {
  const { host, protocol } = initialState.settings || {}

  return {
    host: host || process.env.NEXT_PUBLIC_HOST || null,
    protocol: protocol || process.env.NEXT_PUBLIC_PROTOCOL || null,
  }
}
