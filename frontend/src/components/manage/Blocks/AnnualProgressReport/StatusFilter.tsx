import { Checkbox, Divider, FormControlLabel, Paper } from '@mui/material'
import React, { Fragment } from 'react'
import { ProjectStatusType } from '@ors/types/api_project_statuses.ts'

interface StatusFilterProps {
  disabled: boolean
  statusOptions: ProjectStatusType[]
  selectedCodes: string[]
  onToggle: (status: ProjectStatusType, checked: boolean) => void
}

export default function StatusFilter({
  disabled,
  statusOptions,
  selectedCodes,
  onToggle,
}: StatusFilterProps) {
  return (
    <Paper component="ul" className="m-0 flex list-none gap-x-2 px-2">
      <li>
        <FormControlLabel
          className="m-0"
          control={<Checkbox defaultChecked disabled size="small" />}
          label="Ongoing and completed projects"
        />
      </li>
      <li>
        <Divider orientation="vertical" />
      </li>
      {statusOptions.map((status, index) => (
        <Fragment key={status.name}>
          <li>
            <FormControlLabel
              disabled={disabled}
              className="m-0"
              control={
                <Checkbox
                  size="small"
                  checked={selectedCodes.includes(status.code)}
                />
              }
              label={status.name}
              onChange={(_, checked) => onToggle(status, checked)}
            />
          </li>
          {index !== statusOptions.length - 1 && (
            <li>
              <Divider orientation="vertical" />
            </li>
          )}
        </Fragment>
      ))}
    </Paper>
  )
}
