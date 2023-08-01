import React from 'react'

import { Box, Chip } from '@mui/material'

export type ChipData = {
  color: string
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
      {props.options.map((chipData) => (
        <Chip
          key={chipData.id}
          className="m-1"
          label={chipData.name}
          variant={selected == chipData.id ? 'filled' : 'outlined'}
          onClick={() => handleClick(chipData.id)}
          style={{
            backgroundColor:
              selected == chipData.id ? chipData.color : 'inherit',
            borderColor: chipData.color,
          }}
        />
      ))}
    </Box>
  )
}
