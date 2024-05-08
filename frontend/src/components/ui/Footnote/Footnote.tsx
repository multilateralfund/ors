import { useContext, useMemo } from 'react'

import { Typography, TypographyProps } from '@mui/material'

import { FootnotesContext } from '@ors/contexts/Footnote/Footnote'

interface FootnoteProps extends TypographyProps {
  children: React.ReactNode
  id: string
  index?: string
}

export default function Footnote(props: FootnoteProps) {
  const footnotes = useContext(FootnotesContext)
  const { id, children, index, ...rest } = props

  const footnotesId = useMemo(() => {
    if (!footnotes?.id) return ''
    return `${footnotes.id}-`
  }, [footnotes])

  return (
    <Typography
      id={`${footnotesId}footnote-${id}`}
      className="italic transition-all"
      {...rest}
    >
      {(index || id) && (
        <span className="font-semibold">{index || `${id}.`}</span>
      )}
      {children}
    </Typography>
  )
}
