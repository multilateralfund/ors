import React, { useMemo } from 'react'

import { Box, Chip } from '@mui/material'
import { isUndefined } from 'lodash'
import resolveConfig from 'tailwindcss/resolveConfig'

import { getContrastText } from '@ors/helpers/Color/Color'

const tailwindConfigModule = require('~/tailwind.config')
const tailwindConfig = resolveConfig(tailwindConfigModule)

export type ChipData = {
  color: string
  id: number
  name: string
}

export type ChipToggleWidgetProps = {
  multiple?: boolean
  onChange?: (ids: Array<number> | null | number) => void
  options: ChipData[]
  value?: Array<number> | null
}

export default function ChipToggleWidget(
  props: ChipToggleWidgetProps,
): JSX.Element {
  const [selected, setSelected] = React.useState<Array<number> | null>(null)

  const isControlled = useMemo(() => {
    return !isUndefined(props.value)
  }, [props.value])

  const items = useMemo(() => {
    return isControlled ? props.value : selected
  }, [props.value, isControlled, selected])

  function getSelected(selected: Array<number> | null, chipId: number) {
    const chipIndex = (selected || []).indexOf(chipId)

    if (!props.multiple) {
      const newSelected = chipIndex > -1 ? null : [chipId]
      return newSelected
    }
    let newSelected = [...(selected || [])]
    if (chipIndex > -1) {
      newSelected.splice(chipIndex, 1)
    } else {
      newSelected = [...(selected || []), chipId]
    }
    return newSelected.length > 0 ? newSelected : null
  }

  function handleClick(chipId: number) {
    const newSelected = getSelected(
      !isControlled ? selected : props.value || null,
      chipId,
    )
    if (!isControlled) {
      setSelected(newSelected)
      props.onChange?.(props.multiple ? newSelected : newSelected?.[0] || null)
    } else {
      props.onChange?.(props.multiple ? newSelected : newSelected?.[0] || null)
    }
  }

  return (
    <Box className="flex flex-wrap justify-center p-1">
      {props.options.map((chipData) => {
        return (
          <Chip
            key={chipData.id}
            className="m-1"
            label={chipData.name}
            style={
              items && items?.indexOf?.(chipData.id) !== -1
                ? {
                    backgroundColor: chipData.color,
                    borderColor: chipData.color,
                    color: chipData.color
                      ? getContrastText({
                          background: chipData.color,
                          dark: tailwindConfig.originalColors.dark.typography
                            .primary,
                          light:
                            tailwindConfig.originalColors.light.typography
                              .primary,
                        })
                      : 'inherit',
                  }
                : {}
            }
            variant={
              items && items?.indexOf?.(chipData.id) !== -1
                ? 'filled'
                : 'outlined'
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
