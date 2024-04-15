'use client'
import React, { useCallback, useId, useState } from 'react'

import { Popover, Typography } from '@mui/material'
import cx from 'classnames'
import { chunk, range } from 'lodash'

import IconButton from '@ors/components/ui/IconButton/IconButton'
import { robotoCondensed } from '@ors/themes/fonts'

import {
  IoCalendarClearOutline,
  IoChevronBackCircleOutline,
  IoChevronForwardCircleOutline,
} from 'react-icons/io5'

export type RangeWidgetProps = {
  className?: string
  label?: string
  max: number
  min: number
  onChange?: (value: number[]) => any
  value?: number[]
}

const EmDashSvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="2"
    viewBox="0 0 21 2"
    width="21"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M1.5 1h18"
      stroke="#0095D5"
      stroke-linecap="round"
      stroke-width="1.5"
    ></path>
  </svg>
)

const PopoverWindow = ({
  max,
  min,
  onChange,
  value,
}: {
  max: number
  min: number
  onChange?: (value: number[]) => any
  value?: number[]
}) => {
  const PAGE_SIZE = 12

  const years = range(min, max + 1)
  const pagedYears = chunk(years, PAGE_SIZE)

  const [curPage, setCurPage] = useState(0)

  const [selectedRange, setSelectedRange] = useState<number[]>(value || [])

  const handleNextPage = useCallback(() => {
    if (curPage + 1 < pagedYears.length) {
      setCurPage((prev) => prev + 1)
    }
  }, [curPage, setCurPage, pagedYears])

  const handlePrevPage = useCallback(() => {
    if (curPage - 1 >= 0) {
      setCurPage((prev) => prev - 1)
    }
  }, [curPage, setCurPage])

  const handleClickYear = (year: number) => {
    let newRange = [...selectedRange]
    const [rangeStart, rangeEnd] = newRange

    if (!rangeStart) {
      newRange = [year]
    } else if (!rangeEnd && year > rangeStart) {
      newRange = [newRange[0], year]
    } else if (rangeStart && rangeEnd) {
      newRange = [year]
    }

    setSelectedRange(newRange)

    if (onChange && newRange[0] && newRange[1]) {
      onChange(newRange)
    }
  }

  const openRange = selectedRange[0] && !selectedRange[1]
  const btnClassess = 'text-secondary hover:text-primary cursor-pointer'

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between gap-x-4">
        <IoChevronBackCircleOutline
          className={cx(btnClassess, {
            'cursor-no-drop opacity-40': curPage == 0,
          })}
          size={24}
          onClick={handlePrevPage}
        />
        <div className="pointer-events-none select-none uppercase">
          Select a range of years
        </div>
        <IoChevronForwardCircleOutline
          className={cx(btnClassess, {
            'cursor-no-drop opacity-40 ': curPage == pagedYears.length - 1,
          })}
          size={24}
          onClick={handleNextPage}
        />
      </div>
      <div className="flex items-center justify-around px-16">
        <div
          className={cx('rounded-md bg-gray-100 px-2 py-1 uppercase', {
            'bg-secondary bg-opacity-10': !selectedRange[0],
          })}
        >
          {selectedRange[0] || 'from'}
        </div>
        <EmDashSvg className="text-secondary" />
        <div
          className={cx('rounded-md bg-gray-100 px-2 py-1 uppercase', {
            'bg-secondary bg-opacity-10': !selectedRange[1],
          })}
        >
          {selectedRange[1] || 'to'}
        </div>
      </div>
      <div className="grid grid-flow-row grid-cols-4 grid-rows-3 gap-0">
        {pagedYears[curPage].map((y) => {
          return (
            <div
              key={y}
              className={cx('cursor-pointer px-3 py-3', {
                'bg-mlfs-hlYellow':
                  selectedRange[0] &&
                  selectedRange[1] &&
                  y >= selectedRange[0] &&
                  y <= selectedRange[1],
                'hover:bg-gray-100': !openRange,
                'hover:bg-mlfs-hlYellow': openRange && y >= selectedRange[0],
              })}
              onClick={() => handleClickYear(y)}
            >
              {y}
            </div>
          )
        })}
      </div>
    </div>
  )
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
            className: cx(
              'min-w-[200px] overflow-visible px-5 py-2 rounded-lg bg-white p-4 shadow-xl border-none',
              robotoCondensed.className,
            ),
          },
        }}
        transformOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        onClose={closeDateRange}
        disableScrollLock
      >
        <PopoverWindow max={max} min={min} value={value} onChange={onChange} />
      </Popover>
    </div>
  )
}
