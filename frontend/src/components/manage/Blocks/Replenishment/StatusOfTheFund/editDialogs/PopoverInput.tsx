'use client'
import type { MouseEvent } from 'react'

import React, { useCallback, useId, useState } from 'react'

import { Popover } from '@mui/material'
import cx from 'classnames'
import { chunk } from 'lodash'

import { IPopoverContentProps, IPopoverInputProps } from '../types'

import {
  IoChevronBackCircleOutline,
  IoChevronForwardCircleOutline,
} from 'react-icons/io5'

const PopoverContent = ({
  closePopover,
  onChange,
  options,
  placeholder,
  value,
}: IPopoverContentProps) => {
  const PAGE_SIZE = 12

  const pagedMeetings = chunk(options, PAGE_SIZE).map((chunk) =>
    chunk.reverse(),
  )

  const [curPage, setCurPage] = useState(0)

  const handleNextPage = useCallback(() => {
    if (curPage + 1 < pagedMeetings.length) {
      setCurPage((prev) => prev + 1)
    }
  }, [curPage, setCurPage, pagedMeetings])

  const handlePrevPage = useCallback(() => {
    if (curPage - 1 >= 0) {
      setCurPage((prev) => prev - 1)
    }
  }, [curPage, setCurPage])

  const handleClickMeeting = (meeting: string) => {
    closePopover()
    if (onChange) {
      onChange(meeting)
    }
  }

  const btnClasses = 'text-secondary hover:text-primary cursor-pointer'

  return (
    <div className="flex flex-col gap-y-4 text-lg uppercase">
      <div className="flex items-center justify-between gap-x-4">
        <IoChevronBackCircleOutline
          className={cx(btnClasses, {
            'cursor-no-drop opacity-40': curPage === pagedMeetings.length - 1,
          })}
          size={24}
          onClick={() => handleNextPage()}
        />
        <div className="pointer-events-none select-none">{placeholder}</div>
        <IoChevronForwardCircleOutline
          className={cx(btnClasses, {
            'cursor-no-drop opacity-40': curPage === 0,
          })}
          size={24}
          onClick={() => handlePrevPage()}
        />
      </div>
      <div className="grid w-full grid-flow-row grid-cols-4 grid-rows-3 justify-items-center gap-1">
        {pagedMeetings[curPage].map((yy: any) => {
          const y = yy.value
          return (
            <div
              key={y}
              className={cx(
                'w-full cursor-pointer rounded-md px-4 py-3 hover:bg-gray-100',
                {
                  'bg-mlfs-hlYellow': y === value,
                },
              )}
              onClick={() => handleClickMeeting(y)}
            >
              {y}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PopoverInput({
  onChange,
  options,
  placeholder,
  value,
}: IPopoverInputProps) {
  const uniqueId = useId()
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [popoverWidth, setPopoverWidth] = useState<null | number>(null)

  const open = Boolean(anchorEl)

  const ariaDescribedBy = open ? `popover-widget-${uniqueId}` : undefined

  const openPopover = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    setAnchorEl(event.currentTarget)
    setPopoverWidth(event.currentTarget.offsetWidth)
  }

  const closePopover = () => {
    setAnchorEl(null)
    setPopoverWidth(null)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        className="relative flex w-full min-w-44 cursor-pointer items-center rounded-lg border border-solid border-primary bg-white px-4 py-2"
        aria-describedby={ariaDescribedBy}
        onClick={openPopover}
      >
        {value ? (
          <div className="text-primary">{value}</div>
        ) : (
          <div className="text-gray-400">{placeholder}</div>
        )}
      </button>
      <Popover
        id={ariaDescribedBy}
        anchorEl={anchorEl}
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
        onClose={closePopover}
        disableScrollLock
      >
        <PopoverContent
          closePopover={closePopover}
          options={options}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </Popover>
    </div>
  )
}
