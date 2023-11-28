import { Typography, TypographyProps } from '@mui/material'

interface FootnoteProps extends TypographyProps {
  children: React.ReactNode
  id: string
}

export default function Footnote(props: FootnoteProps) {
  const { id, children, ...rest } = props
  return (
    <Typography
      id={`footnote-${id}`}
      className="italic transition-all"
      {...rest}
    >
      {id}. {children}
    </Typography>
  )
}
