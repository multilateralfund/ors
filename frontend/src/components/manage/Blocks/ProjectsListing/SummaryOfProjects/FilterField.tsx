import React from 'react'
import { ApiFilterOption } from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/types.ts'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'
import MultiselectWithSelectAll from '@ors/components/manage/Form/MultiselectWithSelectAll.tsx'

export const FilterField = (props: {
  label: string
  options: ({ disabled?: boolean } & ApiFilterOption)[]
  onChange: (value: string) => void
  value: any
}) => {
  const { options, label, value, onChange } = props
  return (
    <div className="flex gap-x-2">
      <Label htmlFor={`filter${label}`} className="w-32">
        {label}
      </Label>
      <MultiselectWithSelectAll
        value={value.split(',').map((v: string) => parseInt(v, 10))}
        onChange={(value) => onChange(value.length ? value.join(',') : '')}
        id={`filter${label}`}
        options={options}
      />
    </div>
  )
}
