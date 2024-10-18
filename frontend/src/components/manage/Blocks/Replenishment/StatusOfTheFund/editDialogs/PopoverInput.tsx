'use client'
import type { MouseEvent } from 'react'

import { useCallback, useId, useState } from 'react'

import { Popover } from '@mui/material'
import cx from 'classnames'
import { chunk } from 'lodash'

import ClearButton from '../../Inputs/ClearButton'
import { STYLE } from '../../Inputs/constants'
import {
  IPopoverContentProps,
  IPopoverInputProps,
  InputOptionType,
} from '../types'

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
  const pagedData = chunk(options, PAGE_SIZE).map((chunk) => chunk.reverse())

  const [currentPage, setCurrentPage] = useState(0)

  const handlePrevPage = useCallback(() => {
    if (currentPage - 1 >= 0) {
      setCurrentPage((prev) => prev - 1)
    }
  }, [currentPage, setCurrentPage])

  const handleNextPage = useCallback(() => {
    if (currentPage + 1 < pagedData.length) {
      setCurrentPage((prev) => prev + 1)
    }
  }, [currentPage, setCurrentPage, pagedData])

  const handleSelectMeeting = (meeting: string) => {
    if (onChange) {
      onChange(meeting)
    }

    closePopover()
  }

  const btnClasses = 'text-secondary hover:text-primary cursor-pointer'

  return (
    <div className="flex flex-col gap-y-4 text-lg uppercase">
      <div className="flex items-center justify-between gap-x-4">
        <IoChevronBackCircleOutline
          className={cx(btnClasses, {
            'cursor-no-drop opacity-40': currentPage === pagedData.length - 1,
          })}
          size={24}
          onClick={handleNextPage}
        />
        <div className="pointer-events-none select-none">{placeholder}</div>
        <IoChevronForwardCircleOutline
          className={cx(btnClasses, {
            'cursor-no-drop opacity-40': currentPage === 0,
          })}
          size={24}
          onClick={handlePrevPage}
        />
      </div>
      <div className="grid w-full grid-flow-row grid-cols-4 grid-rows-3 justify-items-center gap-1">
        {pagedData[currentPage].map((meeting: InputOptionType) => {
          const meetingNr = meeting.value
          const meetingLabel = meeting.label

          return (
            <div
              key={meetingNr}
              className={cx(
                'w-full cursor-pointer rounded-md px-4 py-3 text-center hover:bg-gray-100',
                {
                  'bg-mlfs-hlYellow': meetingNr === value,
                },
              )}
              onClick={() => handleSelectMeeting(meetingNr)}
            >
              {meetingLabel}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PopoverInput({
  onChange,
  onClear,
  options,
  placeholder,
  value,
  withClear,
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

  const handleClear = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (onClear) {
      onClear()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          className="relative flex w-full min-w-44 cursor-pointer items-center justify-between gap-2 rounded-lg border border-solid border-primary bg-white px-4 py-2"
          aria-describedby={ariaDescribedBy}
          style={STYLE}
          onClick={openPopover}
        >
          {value ? (
            <div className="text-primary">{value}</div>
          ) : (
            <div className="text-gray-500">{placeholder}</div>
          )}
        </button>
        {withClear && <ClearButton className="right-3" onClick={handleClear} />}
      </div>

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
