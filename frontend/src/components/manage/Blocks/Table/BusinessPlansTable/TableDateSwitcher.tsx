import Field from '@ors/components/manage/Form/Field'
import { KeyboardEvent } from 'react'
import { IoChevronDown } from 'react-icons/io5'

export type TableDataSelectorValuesType = 'all' | 'comments' | 'odp' | 'values'

const TableDataSelectorLabels = [
  { value: 'all', label: 'View All' },
  { value: 'comments', label: 'Comments' },
  {
    value: 'odp',
    label: 'ODP/MT/CO₂-eq',
  },
  { value: 'values', label: 'Values' },
]

interface TableDataSelectorProps {
  changeHandler: (value: TableDataSelectorValuesType) => void
  className?: string
  value: TableDataSelectorValuesType
}

export default function TableDateSwitcher({
  changeHandler,
  value,
}: TableDataSelectorProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  return (
    <Field
      FieldProps={{
        className: 'mb-0 w-full md:w-[8.13rem] BPList BPGridSwitcher',
      }}
      widget="autocomplete"
      disableClearable
      options={TableDataSelectorLabels}
      value={
        TableDataSelectorLabels.find((opt) => opt.value === value) ??
        TableDataSelectorLabels[0]
      }
      onChange={(_: any, { value }: any) => {
        changeHandler(value)
      }}
      renderOption={(props, option) => (
        <li {...props} style={{ textTransform: 'uppercase' }}>
          {option.label}
        </li>
      )}
      onKeyDown={handleKeyDown}
      popupIcon={<IoChevronDown size="18" color="#2F2F38" />}
      componentsProps={{
        popupIndicator: {
          sx: {
            transform: 'none !important',
          },
        },
      }}
    />
  )
}
