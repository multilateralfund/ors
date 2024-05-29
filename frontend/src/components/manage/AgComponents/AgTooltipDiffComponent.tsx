import { useState } from 'react'

import { ClickAwayListener, Tooltip, Typography } from '@mui/material'

import { useStore } from '@ors/store'

const RemarksDiff = (props: any) => {
  const { remarks } = props
  const { newRemarks, oldRemarks } = remarks
  const { report } = useStore((state) => state.cp_reports)
  const currentVersion = report.data?.version

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        <Typography className="font-bold" component="h1" variant="subtitle1">
          {currentVersion && `Remarks version ${currentVersion}:`}
        </Typography>
        <Typography component="h1" variant="subtitle1">
          {newRemarks}
        </Typography>
      </div>
      <div className="flex flex-col">
        <Typography className="font-bold" component="h1" variant="subtitle1">
          {currentVersion && `Remarks version ${currentVersion - 1}:`}
        </Typography>
        <Typography component="h1" variant="subtitle1">
          {oldRemarks}
        </Typography>
      </div>
    </div>
  )
}

export default function AgTooltipDiffComponent(props: any) {
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
          title={remarks ? <RemarksDiff remarks={remarks} /> : title}
          onMouseEnter={handleTooltipOpen}
        >
          {children}
        </Tooltip>
      </ClickAwayListener>
    )
  }
  return children
}
