import React, { useMemo } from 'react'

import { Box, Chip } from '@mui/material'
import { isNumber, isUndefined } from 'lodash'

import { getContrastText } from '@ors/helpers/Color/Color'

export type ChipData = {
  color: string
  id: number
  name: string
}

export type ChipToggleWidgetProps = {
  disabled?: boolean
  options: ChipData[]
  value?: number[]
} & (
  | {
      multiple: false
      onChange?: (value: number) => void
    }
  | {
      multiple: true
      onChange?: (value: number[]) => void
    }
  | {
      multiple?: null
      onChange?: (value: number[]) => void
    }
)

function convertToArray(value?: number | number[]) {
  if (!value) {
    return []
  }
  return isNumber(value) ? [value] : value
}

export default function ChipToggleWidget({
  disabled,
  multiple,
  ...props
}: ChipToggleWidgetProps): JSX.Element {
  const [selected, setSelected] = React.useState<number[]>([])

  const isControlled = useMemo(() => {
    return !isUndefined(props.value)
  }, [props.value])

  const items = useMemo(() => {
    return isControlled ? convertToArray(props.value) : selected
  }, [props.value, isControlled, selected])

  function getSelected(selected: number[], chipId: number) {
    const chipIndex = selected.indexOf(chipId)

    if (!multiple) {
      return chipIndex > -1 ? [] : [chipId]
    }
    let newSelected = [...selected]
    if (chipIndex > -1) {
      newSelected.splice(chipIndex, 1)
    } else {
      newSelected = [...selected, chipId]
    }
    return newSelected
  }

  function handleClick(chipId: number) {
    const newSelected = getSelected(
      !isControlled ? selected : convertToArray(props.value),
      chipId,
    )
    if (isControlled) {
      setSelected(newSelected)
    }
    if (multiple) {
      props.onChange?.(newSelected as number & number[])
    } else {
      props.onChange?.(newSelected[0] as number & number[])
    }
  }

  return (
    <Box className="flex flex-wrap justify-center p-1">
      {props.options.map((chipData) => {
        return (
          <Chip
            key={chipData.id}
            className="m-1"
            disabled={disabled}
            label={chipData.name}
            style={
              items.indexOf?.(chipData.id) !== -1
                ? {
                    backgroundColor: chipData.color,
                    borderColor: chipData.color,
                    color: chipData.color
                      ? getContrastText({ background: chipData.color })
                      : 'inherit',
                  }
                : {}
            }
            variant={
              items.indexOf?.(chipData.id) !== -1 ? 'filled' : 'outlined'
            }
            onClick={() => {
              handleClick(chipData.id)
            }}
          />
        )
      })}
    </Box>
  )
}
