import React from 'react'

import { Box, Chip } from '@mui/material'

export type ChipData = {
  color: string
  contrastText: string
  id: number
  name: string
}

export type ChipToggleWidgetProps = {
  multiple?: boolean
  onChange?: (ids: Array<number> | null | number) => void
  options: ChipData[]
}

export type ChipToggleWidget = (props: ChipToggleWidgetProps) => JSX.Element

export default function ChipToggleWidget(
  props: ChipToggleWidgetProps,
): JSX.Element {
  const [selected, setSelected] = React.useState<Array<number> | null>(null)

  function handleClick(chipId: number) {
    const chipIndex = (selected || []).indexOf(chipId)

    if (!props.multiple) {
      const newSelected = chipIndex > -1 ? null : [chipId]
      setSelected(newSelected)
      props.onChange?.(newSelected?.[0] || null)
      return
    }
    let newSelected = [...(selected || [])]
    if (chipIndex > -1) {
      newSelected.splice(chipIndex, 1)
    } else {
      newSelected = [...(selected || []), chipId]
    }
    setSelected(newSelected.length > 0 ? newSelected : null)
    props.onChange?.(props.multiple ? selected : selected?.[0] || null)
  }

  return (
    <Box className="flex flex-wrap justify-center p-1">
      {props.options.map((chipData) => {
        return (
          <Chip
            key={chipData.id}
            className="m-1"
            label={chipData.name}
            onClick={() => handleClick(chipData.id)}
            style={
              selected && selected?.indexOf?.(chipData.id) !== -1
                ? {
                    backgroundColor: chipData.color,
                    borderColor: chipData.color,
                    color: chipData.contrastText || 'inherit',
                  }
                : {}
            }
            variant={
              selected && selected?.indexOf?.(chipData.id) !== -1
                ? 'filled'
                : 'outlined'
            }
          />
        )
      })}
    </Box>
  )
}
