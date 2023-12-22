import { useMemo } from 'react'

import { map, sortBy } from 'lodash'

import Footnote from '@ors/components/ui/Footnote/Footnote'
import { useStore } from '@ors/store'

export default function Footnotes() {
  const footnotes = useStore((state) => state.footnotes)

  const notes = useMemo(() => {
    return sortBy(footnotes.notes, 'order')
  }, [footnotes.notes])

  return map(notes, (note) => {
    return (
      <Footnote id={note.id} key={note.id} index={note.index}>
        {note.content}
      </Footnote>
    )
  })
}
