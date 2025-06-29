import { ToggleButton, ToggleButtonGroup } from '@mui/material'

import { ViewSelectorValuesType } from '../../BusinessPlans/types'

import { MdOutlineTableChart } from 'react-icons/md'
import { FaList } from 'react-icons/fa6'
import { reverse } from 'lodash'

interface TableViewSelectorProps {
  changeHandler: (
    event: React.MouseEvent<HTMLElement>,
    value: ViewSelectorValuesType,
  ) => void
  value: ViewSelectorValuesType
  reverseViewOrder?: boolean
}

const TableViewSelectorLabels: Record<string, any> = {
  list: <FaList size={14} />,
  table: <MdOutlineTableChart size={14} />,
}

export default function TableViewSelector({
  changeHandler,
  value,
  reverseViewOrder = false,
}: TableViewSelectorProps) {
  const viewOptions = ['table', 'list']
  const updatedViewOption = reverseViewOrder
    ? reverse(viewOptions)
    : viewOptions

  return (
    <ToggleButtonGroup
      aria-label="Platform"
      color="primary"
      value={value}
      onChange={changeHandler}
      exclusive
    >
      {updatedViewOption.map((viewOpt) => (
        <ToggleButton
          key={viewOpt}
          className="h-[2.25rem] rounded-none border-primary bg-white py-[11px] text-base tracking-wide text-primary first:rounded-l-lg last:rounded-r-lg"
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
