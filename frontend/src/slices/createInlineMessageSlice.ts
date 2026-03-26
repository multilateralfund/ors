import type { CreateSliceProps, InlineMessageSlice } from '@ors/types/store'
import { produce } from 'immer'

export const createInlineMessageSlice = ({
  set,
}: CreateSliceProps): InlineMessageSlice => ({
  inlineMessage: null,
  setInlineMessage: (inlineMessage) =>
    set(
      produce((state) => {
        state.inlineMessage.inlineMessage = inlineMessage
      }),
    ),
})
