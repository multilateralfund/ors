'use client'
import { useId, useState } from 'react'

import { Popover, Slider, Typography } from '@mui/material'
import cx from 'classnames'

import IconButton from '@ors/components/ui/IconButton/IconButton'

import { IoCalendarClearOutline } from 'react-icons/io5'

export type RangeWidgetProps = {
  className?: string
  label?: string
  max?: number
  min?: number
  onChange?: (event: Event, value: number | number[]) => any
  value?: number | number[]
}

export default function RangeWidget({
  className,
  label,
  max,
  min,
  onChange,
  value,
}: RangeWidgetProps) {
  const uniqueId = useId()
  const [dateRangeEl, setDateRangeEl] = useState<HTMLButtonElement | null>(null)

  const openDateRange = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDateRangeEl(event.currentTarget)
  }

  const closeDateRange = () => {
    setDateRangeEl(null)
  }

  const open = Boolean(dateRangeEl)

  return (
    <div className={cx('range flex items-center gap-2', className)}>
      {label && (
        <Typography className="text-typography-secondary" component="span">
          {label}
        </Typography>
      )}
      <IconButton
        aria-describedby={open ? `range-widget-${uniqueId}` : undefined}
        onClick={openDateRange}
      >
        <IoCalendarClearOutline size="1rem" />
      </IconButton>
      <Popover
        id={open ? `range-widget-${uniqueId}` : undefined}
        anchorEl={dateRangeEl}
        open={open}
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'top',
        }}
        slotProps={{
          paper: {
            className: 'min-w-[200px] overflow-visible px-5 py-2',
          },
        }}
        transformOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        onClose={closeDateRange}
        disableScrollLock
      >
        <Slider
          className="block"
          getAriaLabel={() => label || ''}
          max={max}
          min={min}
          value={value}
          valueLabelDisplay="auto"
          onChange={onChange}
        />
      </Popover>
    </div>
  )
}
