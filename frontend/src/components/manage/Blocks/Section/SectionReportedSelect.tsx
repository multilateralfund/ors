import { useState } from 'react'

import { MenuItem, Select, SelectChangeEvent } from '@mui/material'

interface SectionReportedSelectProps {
  onSectionCheckChange: (section: string, isChecked: boolean) => void
  sectionName: string
  sectionsChecked: Record<string, boolean>
}

const SectionReportedSelect = ({
  onSectionCheckChange,
  sectionName,
  sectionsChecked,
}: SectionReportedSelectProps) => {
  const isSectionChecked = sectionsChecked[sectionName]
  const [selectedValue, setSelectedValue] = useState(
    isSectionChecked ? 'report' : 'no_report',
  )

  const handleChange = (event: SelectChangeEvent<string>) => {
    const isChecked = event.target.value === 'report'
    setSelectedValue(event.target.value)
    onSectionCheckChange(sectionName, isChecked)
  }

  return (
    <div className="ReportSelect w-full bg-gray-200 p-4">
      <Select
        value={selectedValue}
        MenuProps={{
          PaperProps: {
            className: 'ReportSelect',
          },
        }}
        onChange={handleChange}
      >
        <MenuItem value="report">Will report data for this section</MenuItem>
        <MenuItem value="no_report">
          Will not report data for this section
        </MenuItem>
      </Select>
    </div>
  )
}

export default SectionReportedSelect
