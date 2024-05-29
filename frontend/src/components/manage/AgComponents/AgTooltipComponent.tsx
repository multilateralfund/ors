import { useState } from 'react'

import { ClickAwayListener, Tooltip, Typography } from '@mui/material'

const RemarksText = (props: any) => {
  const { children } = props
  return (
    <Typography component="h1" variant="subtitle1">
      {children}
    </Typography>
  )
}

export default function AgTooltipComponent(props: any) {
  const {
    children,
    placement = 'top-start',
    remarks,
    tooltipValue,
    value,
  } = props

  const [open, setOpen] = useState(false)

  const handleTooltipClose = () => {
    if (remarks) {
      setOpen(false)
    }
  }

  const handleTooltipOpen = () => {
    if (remarks) {
      setOpen(true)
    }
  }

  const title = tooltipValue || value

  if (tooltipValue || props.colDef.tooltip || props.data?.tooltip) {
    return (
      <ClickAwayListener onClickAway={handleTooltipClose}>
        <Tooltip
          enterDelay={300}
          open={remarks ? open : undefined}
          placement={placement}
          title={remarks ? <RemarksText>{title}</RemarksText> : title}
          onMouseEnter={handleTooltipOpen}
        >
          {children}
        </Tooltip>
      </ClickAwayListener>
    )
  }
  return children
}
