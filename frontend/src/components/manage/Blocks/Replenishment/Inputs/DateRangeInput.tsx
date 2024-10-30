import { ChangeEventHandler, useState } from 'react'

import { DateInput } from '@ors/components/manage/Blocks/Replenishment/Inputs/index'
import { DateRangeInputProps } from '@ors/components/manage/Blocks/Replenishment/Inputs/types'

export function DateRangeInput(props: DateRangeInputProps) {
  const { disabled, initialEnd, initialStart, onChange } = props

  const [start, setStart] = useState(initialStart)
  const [end, setEnd] = useState(initialEnd)

  const handleChangeStart: ChangeEventHandler<HTMLInputElement> = (evt) => {
    onChange(evt.target.value, end)
    setStart(evt.target.value)
  }

  const handleChangeEnd: ChangeEventHandler<HTMLInputElement> = (evt) => {
    onChange(start, evt.target.value)
    setEnd(evt.target.value)
  }

  return (
    <div className="flex">
      <DateInput
        disabled={disabled}
        value={start}
        onChange={handleChangeStart}
      />
      <DateInput
        disabled={disabled}
        min={start}
        value={end}
        onChange={handleChangeEnd}
      />
    </div>
  )
}
