import { createContext, useId, useState } from 'react'

import { produce } from 'immer'
import { find, remove } from 'lodash'

export type Note = {
  content: string
  id: string
  index?: string
  order: number | string
}

export interface FootnotesContextProps {
  addNote: (note: Note) => void
  id: string
  notes: Array<Note>
  removeNote: (id: string) => void
  setNotes: (notes: Array<Note>) => void
}

export const FootnotesContext = createContext(
  null as unknown as FootnotesContextProps,
)

export const FootnotesProvider = (props: { children: React.ReactNode }) => {
  const { children } = props
  const id = useId()
  const [notes, setNotes] = useState<Array<Note>>([])

  const addNote = (note: Note) => {
    setNotes(
      produce((notes) => {
        if (find(notes, { id: note.id })) return
        notes.push({ ...note, order: note.order ?? note.id })
      }),
    )
  }

  const removeNote = (id: string) => {
    setNotes(
      produce((notes) => {
        remove(notes, (note: any) => note.id === id)
      }),
    )
  }

  return (
    <FootnotesContext.Provider
      value={{
        id,
        addNote,
        notes,
        removeNote,
        setNotes,
      }}
    >
      {children}
    </FootnotesContext.Provider>
  )
}
