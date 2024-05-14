import { FC } from 'react'

import Checkbox from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'

interface ReportStatusProps {
  isCreate?: boolean
  isEdit?: boolean
  onSectionCheckChange?: (section: string, isChecked: boolean) => void
  report: any
  sectionsChecked: Record<string, boolean>
}

const ReportStatus: FC<ReportStatusProps> = ({
  isCreate,
  isEdit,
  onSectionCheckChange,
  report,
  sectionsChecked,
}) => {
  const handleSectionCheckChange = (section: string, isChecked: boolean) => {
    if (onSectionCheckChange) {
      onSectionCheckChange(section, isChecked)
    }
  }

  return (
    <div className="flex flex-wrap gap-4">
      <FormControl
        className="inline-flex flex-col"
        component="fieldset"
        fullWidth={false}
        variant="standard"
      >
        <legend className="mb-3 text-2xl font-normal">Status</legend>
        <FormGroup className="rounded-lg bg-white px-4 py-1 shadow-lg" row>
          <FormControlLabel
            label="Final"
            control={
              <Checkbox checked={report?.status === 'final'} size="small" />
            }
            disabled
          />
        </FormGroup>
      </FormControl>

      <FormControl
        className="inline-flex flex-col"
        component="fieldset"
        fullWidth={false}
        variant="standard"
      >
        {Object.keys(sectionsChecked).length > 0 && (
          <>
            <legend className="mb-3 text-2xl font-normal">
              Select sections to be reported
            </legend>
            <FormGroup className="rounded-lg bg-white px-4 py-1 shadow-lg" row>
              {Object.entries(sectionsChecked).map(([section, checked]) => (
                <FormControlLabel
                  key={section}
                  label={`Section ${section.slice(-1).toUpperCase()}`}
                  control={
                    <Checkbox
                      checked={checked}
                      disabled={!isEdit && !isCreate}
                      size="small"
                      onChange={(event) =>
                        handleSectionCheckChange(section, event.target.checked)
                      }
                    />
                  }
                />
              ))}
            </FormGroup>
          </>
        )}
      </FormControl>
    </div>
  )
}

export default ReportStatus
