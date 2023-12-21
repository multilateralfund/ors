import type { FootnotesSlice } from '@ors/types/store'

import { produce } from 'immer'
import { find } from 'lodash'

import { CreateSliceProps } from '@ors/store'

export const createFootnotesSlice = ({
  set,
}: CreateSliceProps): FootnotesSlice => {
  return {
    addNote: (note) => {
      set(
        produce((state) => {
          if (find(state.footnotes.notes, { id: note.id })) return
          state.footnotes.notes.push({ ...note, order: note.order ?? note.id })
        }),
      )
    },
    notes: [],
    removeNote: (id) => {
      set(
        produce((state) => {
          state.footnotes.notes = state.footnotes.notes.filter(
            (note: any) => note.id !== id,
          )
        }),
      )
    },
    setNotes: (notes) => {
      set(
        produce((state) => {
          state.footnotes.notes = notes
        }),
      )
    },
  }
}
