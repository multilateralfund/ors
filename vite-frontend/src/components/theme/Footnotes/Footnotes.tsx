import { useContext, useMemo } from 'react'

import { map, sortBy } from 'lodash'

import Footnote from '@ors/components/ui/Footnote/Footnote'
import { FootnotesContext } from '@ors/contexts/Footnote/Footnote'

export default function Footnotes() {
  const footnotes = useContext(FootnotesContext)

  const notes = useMemo(() => {
    if (!footnotes?.notes) return []
    return sortBy(footnotes.notes, 'order')
  }, [footnotes?.notes])

  return map(notes, (note) => {
    return (
      <Footnote id={note.id} key={note.id} index={note.index}>
        {note.content}
      </Footnote>
    )
  })
}
