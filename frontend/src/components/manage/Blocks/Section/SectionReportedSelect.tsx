import { MenuItem, Select, SelectChangeEvent } from '@mui/material'

interface SectionReportedSelectProps {
  isSectionChecked: boolean
  onSectionCheckChange: (section: string, isChecked: boolean) => void
  sectionName: string
}

const SectionReportedSelect = ({
  isSectionChecked,
  onSectionCheckChange,
  sectionName,
}: SectionReportedSelectProps) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    const isChecked = event.target.value === 'report'
    onSectionCheckChange(sectionName, isChecked)
  }

  return (
    <div className="ReportSelect w-full bg-gray-200 p-4">
      <Select
        value={isSectionChecked ? 'report' : 'no_report'}
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
