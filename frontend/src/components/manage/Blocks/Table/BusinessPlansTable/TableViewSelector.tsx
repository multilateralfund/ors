import { ToggleButton, ToggleButtonGroup } from '@mui/material'

import { ViewSelectorValuesType } from '../../BusinessPlans/types'

import { FaList } from 'react-icons/fa6'
import { MdOutlineTableChart } from 'react-icons/md'

interface TableViewSelectorProps {
  changeHandler: (
    event: React.MouseEvent<HTMLElement>,
    value: ViewSelectorValuesType,
  ) => void
  value: ViewSelectorValuesType
}

const TableViewSelectorLabels: Record<string, any> = {
  list: <FaList size={14} />,
  table: <MdOutlineTableChart size={14} />,
}

export default function TableViewSelector({
  changeHandler,
  value,
}: TableViewSelectorProps) {
  const viewOptions = ['table', 'list']

  return (
    <ToggleButtonGroup
      aria-label="Platform"
      color="primary"
      value={value}
      onChange={changeHandler}
      exclusive
    >
      {viewOptions.map((viewOpt) => (
        <ToggleButton
          key={viewOpt}
          className="h-10 rounded-none border-primary bg-white py-[11px] text-base tracking-wide text-primary first:rounded-l-lg last:rounded-r-lg"
          value={viewOpt}
          classes={{
            selected: '!bg-primary !text-mlfs-hlYellow',
          }}
        >
          {TableViewSelectorLabels[viewOpt]}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
