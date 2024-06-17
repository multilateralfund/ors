import { useState } from 'react'

import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import cx from 'classnames'

const TableDataSelectorOrder = ['sector', 'trade', 'all']
type TableDataSelectorValuesType = 'all' | 'sector' | 'trade'

const TableDataSelectorLabels: Record<string, string> = {
  all: 'View All',
  sector: 'Usage by Sector',
  trade: 'Substance Trade',
}

export const useTableDataSelector = (
  initialValue: TableDataSelectorValuesType = 'all',
) => {
  const [value, setValue] = useState(initialValue)

  return { setValue, value }
}

interface TableDataSelectorProps {
  changeHandler: (
    event: React.MouseEvent<HTMLElement>,
    value: TableDataSelectorValuesType,
  ) => void
  className?: string
  value: TableDataSelectorValuesType
}

export default function TableDataSelector({
  changeHandler,
  className = '',
  value,
}: TableDataSelectorProps) {
  return (
    <ToggleButtonGroup
      className={cx(className)}
      aria-label="Platform"
      color="primary"
      value={value}
      onChange={changeHandler}
      exclusive
    >
      {TableDataSelectorOrder.map((key) => (
        <ToggleButton
          key={key}
          className="rounded-none border-primary py-2 text-base tracking-wide first:rounded-l-lg last:rounded-r-lg"
          value={key}
          classes={{
            selected: 'bg-primary text-mlfs-hlYellow',
            standard: 'bg-white text-primary',
          }}
        >
          {TableDataSelectorLabels[key]}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
