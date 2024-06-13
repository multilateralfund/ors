'use client'
import React, { useCallback, useId, useState } from 'react'

import { Popover, Typography } from '@mui/material'
import cx from 'classnames'
import { chunk, range } from 'lodash'

import {
  IoChevronBackCircleOutline,
  IoChevronForwardCircleOutline,
  IoEllipseOutline,
} from 'react-icons/io5'

export type YearRangeWidgetProps = {
  className?: string
  label?: string
  max: number
  min: number
  onChange?: (value: number[]) => any
  value?: number[]
}

function inRange(start: number, end: number, number: number) {
  const range = [start, end]
  range.sort()
  return number >= range[0] && number <= range[1]
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
      strokeLinecap="round"
      strokeWidth="1.5"
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

  const years = range(min, max + 1).reverse()
  const pagedYears = chunk(years, PAGE_SIZE).map((chunk) => chunk.reverse())

  const [curPage, setCurPage] = useState(0)
  const [hoverYear, setHoverYear] = useState<null | number>(null)

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
    const newRange = [year]

    if (selectedRange.length === 1) {
      newRange.splice(0, 0, ...selectedRange)
      newRange.sort()
    }

    setSelectedRange(newRange)

    if (onChange && newRange.length == 2) {
      onChange(newRange)
    }
  }

  const [rangeStart, rangeEnd] = selectedRange
  const openRange = selectedRange[0] && !selectedRange[1]
  const btnClasses = 'text-secondary hover:text-primary cursor-pointer'

  return (
    <div className="flex flex-col gap-y-4 text-lg uppercase">
      <div className="flex items-center justify-between gap-x-4">
        <IoChevronBackCircleOutline
          className={cx(btnClasses, {
            'cursor-no-drop opacity-40': curPage === pagedYears.length - 1,
          })}
          size={24}
          onClick={handleNextPage} // Navigate to older years
        />
        <div className="pointer-events-none select-none">Select a range</div>
        <IoChevronForwardCircleOutline
          className={cx(btnClasses, {
            'cursor-no-drop opacity-40': curPage === 0,
          })}
          size={24}
          onClick={handlePrevPage} // Navigate to newer years
        />
      </div>
      <div className="flex items-center justify-center gap-3">
        <div
          className={cx('rounded-md bg-gray-100 px-2 py-1 uppercase', {
            'bg-secondary bg-opacity-10': !rangeStart,
          })}
        >
          {rangeStart || 'from'}
        </div>
        <EmDashSvg className="text-secondary" />
        <div
          className={cx('rounded-md bg-gray-100 px-2 py-1 uppercase', {
            'bg-secondary bg-opacity-10': !rangeEnd,
          })}
        >
          {rangeEnd || 'to'}
        </div>
      </div>
      <div className="grid w-full grid-flow-row grid-cols-4 grid-rows-3 justify-items-center gap-1">
        {pagedYears[curPage].map((y) => {
          const includedInRange =
            rangeStart && rangeEnd && y >= rangeStart && y <= rangeEnd
          const highlightTentative =
            rangeStart &&
            !rangeEnd &&
            hoverYear &&
            inRange(rangeStart, hoverYear, y)

          return (
            <div
              key={y}
              className={cx('w-full cursor-pointer rounded-md px-4 py-3', {
                'bg-mlfs-hlYellow': includedInRange || highlightTentative,
                'hover:bg-gray-100': !openRange && !includedInRange,
                'hover:bg-mlfs-hlYellow': openRange && y >= rangeStart,
                'hover:outline hover:outline-mlfs-hlYellowTint':
                  !openRange && includedInRange,
              })}
              onClick={() => handleClickYear(y)}
              onMouseEnter={() => setHoverYear(y)}
            >
              {y}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function YearRangeWidget({
  className,
  label,
  max,
  min,
  onChange,
  value,
}: YearRangeWidgetProps) {
  const uniqueId = useId()
  const [dateRangeEl, setDateRangeEl] = useState<HTMLButtonElement | null>(null)
  const [popoverWidth, setPopoverWidth] = useState<null | number>(null)

  const openDateRange = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDateRangeEl(event.currentTarget)
    setPopoverWidth(event.currentTarget.offsetWidth)
  }

  const closeDateRange = () => {
    setDateRangeEl(null)
  }

  const open = Boolean(dateRangeEl)

  return (
    <div className={cx('range flex items-center gap-2', className)}>
      <button
        className="flex h-10 w-full cursor-pointer items-center rounded-lg border-2 border-solid border-primary bg-white py-1.5 pl-1.5 pr-[39px]"
        aria-describedby={open ? `range-widget-${uniqueId}` : undefined}
        onClick={openDateRange}
      >
        <div className="flex items-center gap-3 py-[2.5px] pl-2 pr-1">
          <IoEllipseOutline className="text-typography-secondary" size={24} />
          {label && (
            <Typography
              className={cx(
                'text-lg uppercase leading-6 text-primary',
              )}
            >
              {label}
            </Typography>
          )}
        </div>
      </button>
      <Popover
        id={open ? `range-widget-${uniqueId}` : undefined}
        anchorEl={dateRangeEl}
        open={open}
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        slotProps={{
          paper: {
            className: cx(
              'overflow-visible mt-2 px-3 pt-3 pb-5 rounded-lg border-2 border-solid border-primary bg-white p-4 shadow-xl',
            ),
            style: { minWidth: popoverWidth ?? 'auto' },
          },
        }}
        transformOrigin={{
          horizontal: 'center',
          vertical: 'top',
        }}
        onClose={closeDateRange}
        disableScrollLock
      >
        <PopoverWindow max={max} min={min} value={value} onChange={onChange} />
      </Popover>
    </div>
  )
}
