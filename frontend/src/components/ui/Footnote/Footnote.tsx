import { Typography, TypographyProps } from '@mui/material'

interface FootnoteProps extends TypographyProps {
  children: React.ReactNode
  id: string
  index?: string
}

export default function Footnote(props: FootnoteProps) {
  const { id, children, index, ...rest } = props
  return (
    <Typography
      id={`footnote-${id}`}
      className="italic transition-all"
      {...rest}
    >
      <span className="font-semibold">{index || `${id}.`}</span> {children}
    </Typography>
  )
}
