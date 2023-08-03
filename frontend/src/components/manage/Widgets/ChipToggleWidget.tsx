import React from 'react'

import { Box, Chip } from '@mui/material'

export type ChipData = {
  color: string
  contrastText: string
  id: number
  name: string
}

export type ChipToggleWidgetProps = {
  onChange?: (id: null | number) => void
  options: ChipData[]
}

export type ChipToggleWidget = (props: ChipToggleWidgetProps) => JSX.Element

export default function ChipToggleWidget(
  props: ChipToggleWidgetProps,
): JSX.Element {
  const [selected, setSelected] = React.useState<null | number>(null)

  function handleClick(chipId: null | number) {
    const newSelected = selected === chipId ? null : chipId
    setSelected(newSelected)
    props.onChange?.(newSelected)
  }

  return (
    <Box className="flex flex-wrap justify-center p-1">
      {props.options.map((chipData) => {
        return (
          <Chip
            key={chipData.id}
            className="m-1"
            label={chipData.name}
            variant={selected == chipData.id ? 'filled' : 'outlined'}
            onClick={() => handleClick(chipData.id)}
            style={
              selected == chipData.id
                ? {
                    backgroundColor: chipData.color,
                    borderColor: chipData.color,
                    color: chipData.contrastText || 'inherit',
                  }
                : {}
            }
          />
        )
      })}
    </Box>
  )
}
