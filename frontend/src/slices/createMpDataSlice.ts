import type { CreateSliceProps, MpDataSlice } from '@ors/types/store'
import { produce } from 'immer'

export const createMpDataSlice = ({ set }: CreateSliceProps): MpDataSlice => ({
  mpData: {} as Record<string, any>,
  setMpData: (mpData) =>
    set(
      produce((state) => {
        const updatedMpData =
          typeof mpData === 'function' ? mpData(state.mpData.mpData) : mpData

        state.mpData.mpData = updatedMpData
      }),
    ),
})
