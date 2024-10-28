'use client'
import type { MouseEvent } from 'react'

import { useCallback, useId, useState } from 'react'

import { Popover } from '@mui/material'
import cx from 'classnames'
import { chunk } from 'lodash'

import { Input } from '../../Inputs'
import ClearButton from '../../Inputs/ClearButton'
import { STYLE } from '../../Inputs/constants'
import { getOrdinalNumberLabel } from '../../utils'
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
  setSelectedEntry,
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

  const handleSelectEntry = (entry: string) => {
    setSelectedEntry(entry)

    if (onChange) {
      onChange(entry)
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
        {pagedData[currentPage].map((entry: InputOptionType) => {
          const entryValue = entry.value
          const entryLabel = entry.label

          return (
            <div
              key={entryValue}
              className={cx(
                'flex w-full cursor-pointer flex-col rounded-md px-3 py-2 text-center hover:bg-gray-100',
                {
                  'bg-mlfs-hlYellow': entryValue === value,
                },
              )}
              onClick={() => handleSelectEntry(entryValue)}
            >
              <span>{getOrdinalNumberLabel(entryLabel)}</span>
              <span className="font-light">{entry.year}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PopoverInput({
  className,
  clearBtnClassName = 'right-4',
  field,
  onChange,
  onClear,
  options,
  placeholder,
  required = false,
  value,
  withClear,
  withInputPlaceholder = true,
}: IPopoverInputProps) {
  const uniqueId = useId()
  const [anchorEl, setAnchorEl] = useState<HTMLInputElement | null>(null)
  const [popoverWidth, setPopoverWidth] = useState<null | number>(null)
  const [selectedEntry, setSelectedEntry] = useState<string>(value || '')

  const open = Boolean(anchorEl)

  const ariaDescribedBy = open ? `popover-widget-${uniqueId}` : undefined

  const openPopover = (event: MouseEvent<HTMLInputElement>) => {
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

    setSelectedEntry('')
    if (onClear) {
      onClear()
    }
  }

  return (
    <>
      <div className="relative flex flex-1">
        <Input
          id={field}
          name={field}
          className={cx(
            'relative flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-solid border-primary bg-white px-4 py-2',
            className,
          )}
          aria-describedby={ariaDescribedBy}
          {...(withInputPlaceholder && { ...{ placeholder } })}
          required={required}
          style={STYLE}
          value={selectedEntry}
          onClick={openPopover}
        />
        {withClear && selectedEntry && (
          <ClearButton className={clearBtnClassName} onClick={handleClear} />
        )}
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
              'overflow-visible mt-2 p-3 rounded-lg border-2 border-solid border-primary bg-white shadow-xl pb-1',
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
          setSelectedEntry={setSelectedEntry}
          value={selectedEntry}
          onChange={onChange}
        />
      </Popover>
    </>
  )
}
