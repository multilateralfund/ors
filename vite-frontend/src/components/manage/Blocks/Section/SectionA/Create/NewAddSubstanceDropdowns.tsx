import React from 'react'

import { Autocomplete, Typography } from '@mui/material'

import TextWidget from '@ors/components/manage/Widgets/TextWidget'

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
      <Autocomplete
        id="mandatory-substances"
        className="widget"
        getOptionLabel={(option: any) => option.display_name}
        groupBy={(option: any) => option.group}
        options={props.mandatoryOptions}
        renderInput={(params) => (
          <TextWidget
            {...params}
            autoComplete="false"
            size="small"
            variant="outlined"
          />
        )}
        onChange={props.onChange}
        disableClearable
        disableCloseOnSelect
      />
      <Typography>Other substances</Typography>
      <Autocomplete
        id="other-substances"
        className="widget"
        getOptionLabel={(option: any) => option.display_name}
        groupBy={(option: any) => option.group}
        options={props.optionalOptions}
        renderInput={(params) => (
          <TextWidget
            {...params}
            autoComplete="false"
            size="small"
            variant="outlined"
          />
        )}
        onChange={props.onChange}
        disableClearable
        disableCloseOnSelect
      />
    </>
  )
}
