import { CSSProperties, MouseEvent, useState } from 'react'

import dayjs, { Dayjs } from 'dayjs'

import { IconButton, Popover } from '@mui/material'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay'
import { IoCalendarOutline, IoChevronBack, IoChevronForward } from 'react-icons/io5'

type DateRangePickerProps = {
  end: string
  label: string
  onChange: (start: string, end: string) => void
  start: string
}

const toDayjs = (value: string) => (value ? dayjs(value) : null)
const toApiDate = (value: Dayjs | null) =>
  value?.isValid() ? value.format('YYYY-MM-DD') : ''
const toDisplayDate = (value: string) =>
  value ? dayjs(value).format('MM/DD/YYYY') : ''

type RangeCalendarHeaderProps = {
  currentMonth: Dayjs
  onMonthChange: (month: Dayjs, direction: 'left' | 'right') => void
  side?: 'left' | 'right'
}

function RangeCalendarHeader({
  currentMonth,
  onMonthChange,
  side = 'left',
}: RangeCalendarHeaderProps) {
  return (
    <div className="flex h-14 items-center px-4">
      {side === 'left' && (
        <IconButton
          size="small"
          onClick={() => onMonthChange(currentMonth.subtract(1, 'month'), 'right')}
        >
          <IoChevronBack size={24} />
        </IconButton>
      )}
      <div className="flex-1 text-center text-xl font-normal">
        {currentMonth.format('MMMM YYYY')}
      </div>
      {side === 'right' && (
        <IconButton
          size="small"
          onClick={() => onMonthChange(currentMonth.add(1, 'month'), 'left')}
        >
          <IoChevronForward size={24} />
        </IconButton>
      )}
    </div>
  )
}

type RangeDayProps = PickersDayProps<Dayjs> & {
  rangeEnd?: Dayjs | null
  rangeStart?: Dayjs | null
}

function RangeDay({
  day,
  outsideCurrentMonth,
  rangeEnd,
  rangeStart,
  ...props
}: RangeDayProps) {
  const isStart = !!rangeStart && day.isSame(rangeStart, 'day')
  const isEnd = !!rangeEnd && day.isSame(rangeEnd, 'day')
  const isBetween =
    !!rangeStart &&
    !!rangeEnd &&
    day.isAfter(rangeStart, 'day') &&
    day.isBefore(rangeEnd, 'day')
  const isInRange = !outsideCurrentMonth && (isStart || isEnd || isBetween)
  const rangeWrapperStyle: CSSProperties = {
    alignItems: 'center',
    backgroundColor: isInRange ? '#e6f0fc' : 'transparent',
    borderRadius:
      isStart && isEnd
        ? '999px'
        : isStart
          ? '999px 0 0 999px'
          : isEnd
            ? '0 999px 999px 0'
            : 0,
    display: 'flex',
    height: 40,
    justifyContent: 'center',
    width: 40,
  }

  return (
    <span style={rangeWrapperStyle}>
      <PickersDay
        {...props}
        className={
          isStart || isEnd
            ? '!m-0 !h-10 !w-10 !rounded-full !border-0 !bg-[#1565c0] !p-0 !text-white !shadow-none hover:!bg-[#1565c0] hover:!text-white'
            : '!m-0 !h-10 !w-10 !rounded-full !border-0 !bg-transparent !p-0 !text-inherit !shadow-none hover:!bg-transparent hover:!text-inherit'
        }
        day={day}
        disableMargin
        outsideCurrentMonth={outsideCurrentMonth}
        selected={isStart || isEnd}
      />
    </span>
  )
}

export default function DateRangePicker({
  end,
  label,
  onChange,
  start,
}: DateRangePickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [selectionStep, setSelectionStep] = useState<'start' | 'end'>('start')
  const [draftStart, setDraftStart] = useState(start)
  const [draftEnd, setDraftEnd] = useState(end)
  const [visibleMonth, setVisibleMonth] = useState(
    () => toDayjs(start)?.startOf('month') || dayjs().startOf('month'),
  )

  const draftStartValue = toDayjs(draftStart)
  const draftEndValue = toDayjs(draftEnd)
  const rightMonth = visibleMonth.add(1, 'month')
  const open = Boolean(anchorEl)
  const displayedStart = open ? draftStart : start
  const displayedEnd = open ? draftEnd : end

  const valueText =
    displayedStart || displayedEnd
      ? [toDisplayDate(displayedStart), toDisplayDate(displayedEnd)]
          .filter(Boolean)
          .join(' - ')
      : label

  const openCalendar = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    setDraftStart(start)
    setDraftEnd(end)
    setVisibleMonth(toDayjs(start)?.startOf('month') || dayjs().startOf('month'))
    setSelectionStep('start')
  }

  const closeCalendar = () => {
    setAnchorEl(null)
  }

  const handleSelectDate = (value: Dayjs | null) => {
    if (!value) {
      return
    }

    const nextValue = toApiDate(value)

    if (selectionStep === 'start' || !draftStart) {
      setDraftStart(nextValue)
      setDraftEnd('')
      setSelectionStep('end')
      return
    }

    if (draftStartValue && value.isBefore(draftStartValue, 'day')) {
      setDraftStart(nextValue)
      setDraftEnd('')
      setSelectionStep('end')
      return
    }

    setDraftEnd(nextValue)
    onChange(draftStart, nextValue)
    closeCalendar()
  }

  return (
    <>
      <button
        className={`col-span-2 flex h-[2.25rem] w-full items-center justify-between gap-3 rounded-lg border-2 border-solid bg-white px-4 text-left text-lg font-normal leading-none text-mlfs-deepTealShade md:w-[18.75rem] ${
          open ? 'border-[#1976d2]' : 'border-primary'
        }`}
        style={{ fontFamily: 'var(--font-roboto-condensed)' }}
        type="button"
        onClick={openCalendar}
      >
        <span className="min-w-0 truncate">{valueText}</span>
        <IoCalendarOutline className="shrink-0 text-gray-500" size={22} />
      </button>
      <Popover
        anchorEl={anchorEl}
        open={open}
        anchorOrigin={{
          horizontal: 'left',
          vertical: 'bottom',
        }}
        onClose={closeCalendar}
      >
        <div className="flex bg-white" style={{ fontFamily: 'var(--font-roboto-condensed)' }}>
          <div className="border-0 border-r border-solid border-gray-200">
            <DateCalendar
              key={visibleMonth.format('YYYY-MM')}
              defaultCalendarMonth={visibleMonth}
              reduceAnimations
              showDaysOutsideCurrentMonth={false}
              value={null}
              slots={{
                calendarHeader: RangeCalendarHeader as any,
                day: RangeDay as any,
              }}
              slotProps={{
                calendarHeader: { side: 'left' } as any,
                day: {
                  rangeEnd: draftEndValue,
                  rangeStart: draftStartValue,
                } as any,
              }}
              sx={{
                width: 312,
                '& .MuiDayCalendar-monthContainer': {
                  overflow: 'visible',
                },
                '& .MuiDayCalendar-weekContainer': {
                  margin: 0,
                },
                '& .MuiDayCalendar-weekDayLabel': {
                  color: '#6b7280',
                  fontSize: '1rem',
                  height: 40,
                  margin: 0,
                  width: 40,
                },
              }}
              onChange={handleSelectDate}
              onMonthChange={(month) => setVisibleMonth(month.startOf('month'))}
            />
          </div>
          <div>
            <DateCalendar
              key={rightMonth.format('YYYY-MM')}
              defaultCalendarMonth={rightMonth}
              reduceAnimations
              showDaysOutsideCurrentMonth={false}
              value={null}
              slots={{
                calendarHeader: RangeCalendarHeader as any,
                day: RangeDay as any,
              }}
              slotProps={{
                calendarHeader: { side: 'right' } as any,
                day: {
                  rangeEnd: draftEndValue,
                  rangeStart: draftStartValue,
                } as any,
              }}
              sx={{
                width: 312,
                '& .MuiDayCalendar-monthContainer': {
                  overflow: 'visible',
                },
                '& .MuiDayCalendar-weekContainer': {
                  margin: 0,
                },
                '& .MuiDayCalendar-weekDayLabel': {
                  color: '#6b7280',
                  fontSize: '1rem',
                  height: 40,
                  margin: 0,
                  width: 40,
                },
              }}
              onChange={handleSelectDate}
              onMonthChange={(month) =>
                setVisibleMonth(month.subtract(1, 'month').startOf('month'))
              }
            />
          </div>
        </div>
      </Popover>
    </>
  )
}
