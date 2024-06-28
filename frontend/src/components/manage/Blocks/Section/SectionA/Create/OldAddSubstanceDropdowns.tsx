import React from 'react'

import { Autocomplete, Typography } from '@mui/material'

import TextWidget from '@ors/components/manage/Widgets/TextWidget'

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
      <Autocomplete
        id="other-substances"
        className="widget"
        getOptionLabel={(option: any) => option.display_name}
        groupBy={(option: any) => option.group}
        options={props.options}
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
