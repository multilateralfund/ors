import { useRef, useState } from 'react'

import { CLASSESS, STYLE } from './constants'
import { IDateInputProps } from './types'

import { IoCalendarOutline } from 'react-icons/io5'
import cx from 'classnames'
import dayjs from 'dayjs'

const DISPLAY_FORMAT = 'DD/MM/YYYY'

const SEGMENT_LENGTHS = [2, 2, 4]

const getDateSegments = (text: string) => {
  const parts = text.replace(/\/+$/, '/').split('/')
  const segments: string[] = []
  let overflow = ''

  for (let index = 0; index < SEGMENT_LENGTHS.length; index++) {
    const hasPart = index < parts.length
    if (!hasPart && !overflow) {
      break
    }

    const digits = hasPart ? parts[index].replace(/\D/g, '') : overflow
    segments.push(digits.slice(0, SEGMENT_LENGTHS[index]))
    overflow =
      hasPart && index + 1 < parts.length
        ? ''
        : digits.slice(SEGMENT_LENGTHS[index])
  }

  return segments
}

export default function TypeableDateInput(props: IDateInputProps) {
  const { id, className, name, onChange, type, value, ...rest } = props

  const [typedValue, setTypedValue] = useState<string | null>(null)

  const realInput = useRef<HTMLInputElement>(null)

  const displayValue = value ? dayjs(value).format(DISPLAY_FORMAT) : ''

  const openPicker = () => {
    const input = realInput.current

    if (input?.showPicker) {
      input.showPicker()
    }
  }

  const emitValue = (isoDate: string) => {
    const input = realInput.current
    if (!input) {
      return
    }

    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set
    setValue?.call(input, isoDate)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }

  const handleTyping = (text: string, isCaretAtEnd: boolean) => {
    const segments = getDateSegments(text)
    const lastSegment = segments.length - 1

    const isTypingForward =
      isCaretAtEnd && text.length > (typedValue ?? displayValue).length
    const addSeparator =
      isTypingForward &&
      lastSegment < SEGMENT_LENGTHS.length - 1 &&
      segments[lastSegment].length === SEGMENT_LENGTHS[lastSegment]

    setTypedValue(segments.join('/') + (addSeparator ? '/' : ''))

    const [day = '', month = '', year = ''] = segments

    if (!segments.join('')) {
      emitValue('')
    } else if (day.length === 2 && month.length === 2 && year.length === 4) {
      const isoDate = `${year}-${month}-${day}`

      if (dayjs(isoDate).format('YYYY-MM-DD') === isoDate) {
        emitValue(isoDate)
      }
    }
  }

  return (
    <div className="relative flex flex-grow">
      <input
        id={id}
        name={name || id}
        className={cx(
          CLASSESS,
          className,
          'pointer-events-none absolute bottom-0 left-0 h-1 w-1 pb-[30px] opacity-0',
        )}
        ref={realInput}
        style={STYLE}
        type="date"
        value={value}
        tabIndex={-1}
        onChange={onChange}
        {...rest}
      />
      <input
        id={`${id}_text`}
        className={cx(CLASSESS, className, 'z-10 pr-9')}
        style={STYLE}
        type="text"
        inputMode="numeric"
        placeholder={DISPLAY_FORMAT}
        value={typedValue ?? displayValue}
        onChange={(event) =>
          handleTyping(
            event.target.value,
            event.target.selectionStart === event.target.value.length,
          )
        }
        onBlur={() => setTypedValue(null)}
        {...rest}
      />
      <button
        type="button"
        tabIndex={-1}
        className="absolute right-2 top-1/2 z-20 flex -translate-y-1/2 cursor-pointer border-0 bg-transparent p-0"
        onClick={openPicker}
      >
        <IoCalendarOutline size={18} />
      </button>
    </div>
  )
}
