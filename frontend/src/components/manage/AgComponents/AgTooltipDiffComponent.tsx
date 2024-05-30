import React, { useEffect, useRef, useState } from 'react'

import {
  ClickAwayListener,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'

import { useStore } from '@ors/store'

import { IoClose } from 'react-icons/io5'

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
          {oldRemarks || 'No remarks'}
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
  const tooltipRef = useRef(null)

  const handleTooltipClose = (event: MouseEvent | TouchEvent) => {
    if (
      remarks &&
      ((event.target as Element).closest('.close-tooltip') ||
        (tooltipRef.current &&
          !(tooltipRef.current as Node).contains(event.target as Node)))
    ) {
      setOpen(false)
    }
  }

  const handleTooltipOpen = () => {
    if (remarks) {
      setOpen(true)
    }
  }

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const title = tooltipValue || value

  if (tooltipValue || props.colDef.tooltip || props.data?.tooltip) {
    return (
      <ClickAwayListener onClickAway={handleTooltipClose}>
        <Tooltip
          enterDelay={300}
          open={remarks ? open : undefined}
          placement={placement}
          title={
            <div className="flex flex-col" ref={tooltipRef}>
              {remarks ? (
                // @ts-ignore
                <IconButton
                  className="close-tooltip flex justify-end"
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation()
                    setOpen(false)
                  }}
                >
                  <IoClose className="text-white" />
                </IconButton>
              ) : null}
              {remarks ? <RemarksDiff remarks={remarks} /> : title}
            </div>
          }
          onMouseEnter={handleTooltipOpen}
        >
          {children}
        </Tooltip>
      </ClickAwayListener>
    )
  }
  return children
}
