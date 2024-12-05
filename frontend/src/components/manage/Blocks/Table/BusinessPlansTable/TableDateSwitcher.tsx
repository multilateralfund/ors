import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import cx from 'classnames'

const TableDataSelectorOrder = ['values', 'odp', 'comments', 'all']
export type TableDataSelectorValuesType = 'all' | 'comments' | 'odp' | 'values'

const TableDataSelectorLabels: Record<string, string | JSX.Element> = {
  all: 'View All',
  comments: 'Comments',
  odp: (
    <span className="mt-1">
      ODP/MT/CO<sub>2</sub>-eq
    </span>
  ),
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
          className="h-10 whitespace-nowrap rounded-none border-primary py-2 text-base tracking-wide first:rounded-l-lg last:rounded-r-lg"
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
