import React from 'react'

import { Typography } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'

export function OldAddSubstanceDropdowns(props: {
  onChange: (_: any, newSubstance: any) => void
  options: Array<any>
}) {
  return (
    <>
      <Typography
        id="add-substance-modal-title"
        className="mb-4 text-typography-secondary"
        component="h2"
        variant="h6"
      >
        Select substance
      </Typography>
      <Field
        Input={{ autoComplete: 'off' }}
        getOptionLabel={(option: any) => option.display_name}
        groupBy={(option: any) => option.group}
        options={props.options}
        value={null}
        widget="autocomplete"
        onChange={props.onChange}
      />
    </>
  )
}
