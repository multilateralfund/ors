import { Autocomplete, Button, Divider, Typography } from '@mui/material'

import TextWidget from '@ors/components/manage/Widgets/TextWidget'

function AddSubstance(props) {
  const {
    autoCompleteFilterOptions,
    autoCompleteRenderOption,
    mandatorySubstances,
    onAddChemical,
    onCancel,
    optionalSubstances,
  } = props
  return (
    <>
      <Typography>Mandatory / usual substances and blends</Typography>
      <Autocomplete
        id="mandatory-substances"
        className="widget"
        filterOptions={autoCompleteFilterOptions}
        getOptionLabel={(option) => option.display_name}
        groupBy={(option) => option.group}
        options={mandatorySubstances}
        renderOption={autoCompleteRenderOption}
        isOptionEqualToValue={function (option, value) {
          return option.row_id === value.row_id
        }}
        renderInput={(params) => (
          <TextWidget
            {...params}
            autoComplete="false"
            size="small"
            variant="outlined"
          />
        )}
        onChange={onAddChemical}
        disableClearable
        disableCloseOnSelect
      />
      <Typography>Optional substances</Typography>
      <Autocomplete
        id="other-substances"
        className="widget"
        filterOptions={autoCompleteFilterOptions}
        getOptionLabel={(option) => option.display_name}
        groupBy={(option) => option.group}
        options={optionalSubstances}
        renderOption={autoCompleteRenderOption}
        isOptionEqualToValue={function (option, value) {
          return option.row_id === value.row_id
        }}
        renderInput={(params) => (
          <TextWidget
            {...params}
            autoComplete="false"
            size="small"
            variant="outlined"
          />
        )}
        onChange={onAddChemical}
        disableClearable
        disableCloseOnSelect
      />

      <Divider className="my-4" />

      <div className="flex flex-row-reverse gap-x-2">
        <Button onClick={onCancel}>Close</Button>
      </div>
    </>
  )
}

export default AddSubstance
