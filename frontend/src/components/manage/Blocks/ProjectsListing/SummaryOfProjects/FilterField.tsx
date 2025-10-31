import { IoChevronDown } from 'react-icons/io5'
import React from 'react'
import { ApiFilterOption } from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/types.ts'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'
import Field from '@ors/components/manage/Form/Field.tsx'

const defaultProps = {
  FieldProps: { className: 'mb-0 w-full' },
  popupIcon: <IoChevronDown size="18" color="#2F2F38" />,
  getOptionLabel: (option: any) => option?.name,
  componentsProps: {
    popupIndicator: {
      sx: {
        transform: 'none !important',
      },
    },
  },
}
export const FilterField = (props: {
  label: string
  options: ({ disabled?: boolean } & ApiFilterOption)[]
  onChange: (value: string) => void
  value: any
}) => {
  const { options, label, value, onChange } = props
  return (
    <div className="flex gap-x-2">
      <Label htmlFor={`#filter${label}`} className="w-32">
        {label}
      </Label>
      <Field
        id={`#filter${label}`}
        Input={{ placeholder: `Click to select` }}
        options={options}
        value={
          options.filter((option) => option.id === parseInt(value, 10))[0] ??
          null
        }
        withDisabledOptions={true}
        widget="autocomplete"
        onChange={(_: any, value: any) => {
          const castValue = value as ApiFilterOption | null
          onChange(castValue?.id.toString() ?? '')
        }}
        {...defaultProps}
      />
    </div>
  )
}
