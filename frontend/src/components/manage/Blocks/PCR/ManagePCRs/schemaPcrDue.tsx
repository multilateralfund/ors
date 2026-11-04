import { useEffect, useRef, useState, FocusEvent } from 'react'

import { TypeableDateInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { TitleColumn, TooltipTitleColumn } from './schema'
import { defaultColDef } from '../PCRListing/schema'
import { formatDate } from '../utils'

import { IoClose } from 'react-icons/io5'
import cx from 'classnames'
import dayjs from 'dayjs'
import {
  ICellRendererParams,
  ValueGetterParams,
  ITooltipParams,
} from 'ag-grid-community'

const PcrDueDateCell = ({
  props,
  unmarkProjects,
  updatePcrDueDate,
}: {
  props: ICellRendererParams
  unmarkProjects: (ids: number[]) => void
  updatePcrDueDate: (id: number, date: string) => void
}) => {
  const inputId = `pcr_due_date_${props.data.id}`
  const savedDate = props.data.pcr_due_date ?? ''

  const [date, setDate] = useState(savedDate)
  const [isEditing, setIsEditing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDate(savedDate)
  }, [savedDate])

  useEffect(() => {
    if (isEditing) {
      containerRef.current
        ?.querySelector<HTMLInputElement>(`#${inputId}_text`)
        ?.focus()
    }
  }, [isEditing, inputId])

  const isDateOverdue = dayjs(date).isBefore(dayjs(), 'day')

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (
      !isEditing ||
      event.target.dataset.display !== undefined ||
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return
    }

    setIsEditing(false)

    if (!date) {
      setDate(savedDate)
    } else if (date !== savedDate) {
      props.node.setData({ ...props.data, pcr_due_date: date })
      updatePcrDueDate(props.data.id, date)
    }
  }

  return (
    <div
      ref={containerRef}
      className={cx(
        'relative flex w-full items-center justify-center gap-2 p-2 px-12',
        { 'cursor-pointer': !isEditing },
      )}
      onClick={() => setIsEditing(true)}
      onKeyDown={(event) => {
        if (isEditing && event.key === 'Enter') {
          ;(event.target as HTMLElement).blur()
        }
      }}
      onBlur={onBlur}
    >
      {isEditing ? (
        <div className="w-36">
          <TypeableDateInput
            id={inputId}
            className={cx('BPListUpload !ml-0 h-8 w-36 !flex-grow-0', {
              '!text-red-500': isDateOverdue,
            })}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
      ) : (
        <span
          className={cx('min-w-0 cursor-pointer truncate whitespace-nowrap', {
            'text-red-500': isDateOverdue,
          })}
          data-display
          tabIndex={0}
          onFocus={() => setIsEditing(true)}
        >
          {formatDate(date) || '-'}
        </span>
      )}
      <IoClose
        className="absolute right-2 min-h-6 min-w-6 cursor-pointer fill-gray-600"
        onClick={(event) => {
          event.stopPropagation()
          unmarkProjects([props.data.id])
        }}
        size={16}
      />
    </div>
  )
}

const getColumnDefsPcrDue = (
  unmarkProjects: (ids: number[]) => void,
  updatePcrDueDate: (id: number, date: string) => void,
) => ({
  columnDefs: [
    {
      headerName: 'Metacode / Title / Country / Agency',
      field: 'umbrella_code',
      minWidth: 300,
      autoHeight: true,
      cellClass: 'ag-cell-ellipsed ag-text-center !pl-0',
      cellRenderer: (props: ICellRendererParams) => (
        <div className="relative flex items-center gap-1 p-1 px-16">
          {TitleColumn(props)}
        </div>
      ),
      tooltipValueGetter: (props: ITooltipParams) => TooltipTitleColumn(props),
    },
    {
      headerName: 'Date completed',
      valueGetter: (params: ValueGetterParams) =>
        formatDate(params.data.date_of_completion),
      tooltipValueGetter: (params: ITooltipParams) =>
        formatDate(params.data.date_of_completion),
    },
    {
      headerName: 'PCR due',
      minWidth: 240,
      suppressKeyboardEvent: () => true,
      valueGetter: (params: ValueGetterParams) =>
        formatDate(params.data.pcr_due_date),
      tooltipValueGetter: (params: ITooltipParams) =>
        formatDate(params.data.pcr_due_date),
      cellRenderer: (props: ICellRendererParams) => (
        <PcrDueDateCell {...{ props, unmarkProjects, updatePcrDueDate }} />
      ),
    },
  ],
  defaultColDef,
})

export default getColumnDefsPcrDue
