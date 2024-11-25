import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import cx from 'classnames'

const TableDataSelectorOrder = ['values', 'odp', 'comments', 'all']
export type TableDataSelectorValuesType = 'all' | 'comments' | 'odp' | 'values'

const TableDataSelectorLabels: Record<string, string> = {
  all: 'View All',
  comments: 'Comments',
  odp: 'ODP',
  values: 'Values',
}

interface TableDataSelectorProps {
  changeHandler: (
    event: React.MouseEvent<HTMLElement>,
    value: TableDataSelectorValuesType,
  ) => void
  className?: string
  value: TableDataSelectorValuesType
}

export default function TableDateSwitcher({
  changeHandler,
  className = '',
  value,
}: TableDataSelectorProps) {
  return (
    <ToggleButtonGroup
      className={cx('table-date-switcher', className)}
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
