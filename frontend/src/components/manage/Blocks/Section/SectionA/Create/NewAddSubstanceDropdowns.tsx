import React from 'react'

import { Typography } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'

export function NewAddSubstanceDropdowns(props: {
  mandatoryOptions: Array<any>
  onChange: (_: any, newSubstance: any) => void
  optionalOptions: Array<any>
}) {
  return (
    <>
      <Typography
        id="add-substance-modal-title"
        className="mb-4"
        component="h2"
        variant="h6"
      >
        Add substances
      </Typography>
      <Typography>Mandatory / usual substances</Typography>
      <Field
        Input={{ autoComplete: 'off' }}
        getOptionLabel={(option: any) => option.display_name}
        groupBy={(option: any) => option.group}
        options={props.mandatoryOptions}
        value={null}
        widget="autocomplete"
        onChange={props.onChange}
      />
      <Typography>Other substances</Typography>
      <Field
        Input={{ autoComplete: 'off' }}
        getOptionLabel={(option: any) => option.display_name}
        groupBy={(option: any) => option.group}
        options={props.optionalOptions}
        value={null}
        widget="autocomplete"
        onChange={props.onChange}
      />
    </>
  )
}
