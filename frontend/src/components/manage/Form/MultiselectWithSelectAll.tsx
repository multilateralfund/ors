import React, { useState, useEffect } from 'react'
import {
  Autocomplete,
  Checkbox,
  FormControl,
  TextField,
  Typography,
  MenuItem,
  ListItemText,
} from '@mui/material'
import { IoChevronDown } from 'react-icons/io5'
import { AutocompleteWidgetProps } from '@ors/components/manage/Widgets/AutocompleteWidget.tsx'
import cx from 'classnames'

interface Option {
  id: number
  name: string
  disabled?: boolean
}

type MultiselectWithSelectAllProps = {
  options: Option[]
  id: AutocompleteWidgetProps['id']
  value: Option['id'][]
  onChange: (value: Option['id'][]) => void
}

const MultiselectWithSelectAll: React.FC<MultiselectWithSelectAllProps> = (
  props,
) => {
  const { options, id, value: propValue, onChange } = props

  // State to track if the dropdown is open
  const [open, setOpen] = useState(false)
  // State to hold the temporary selection while the dropdown is open
  const [internalSelection, setInternalSelection] = useState<Option[]>([])

  // Sync local state with props when the dropdown is closed or on mount
  useEffect(() => {
    if (!open) {
      setInternalSelection(
        options.filter((option) => propValue.includes(option.id)),
      )
    }
  }, [propValue, open, options])

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = (_event: React.SyntheticEvent) => {
    setOpen(false)
    // Commit the changes to the parent only when the dropdown closes
    onChange(internalSelection.map((item) => item.id))
  }

  const enabledOptions = options.filter((option) => !option.disabled)
  const numEnabled = enabledOptions.length
  const isAllSelected = internalSelection.length === numEnabled

  const handleToggleAll = () => {
    const newSelection = isAllSelected ? [] : enabledOptions
    setInternalSelection(newSelection)
  }

  const handleOptionChange = (
    _event: React.SyntheticEvent,
    newValue: Option[],
    reason: string, // Add reason parameter to handle 'clear'
  ) => {
    if (reason === 'clear') {
      const emptyIds = newValue.map((item) => item.id)
      onChange(emptyIds)
      setInternalSelection(newValue)
      return
    }

    // If the user clicked "Select All", handle differently
    const lastSelected = newValue[newValue.length - 1]
    if (lastSelected && lastSelected.id === -1) {
      handleToggleAll()
      return
    }

    // Standard selection: Update local state only
    setInternalSelection(newValue)
  }

  return (
    <FormControl sx={{ minWidth: 240 }}>
      <Autocomplete
        id={id}
        open={open}
        onOpen={handleOpen}
        onClose={handleClose}
        disableCloseOnSelect={true}
        multiple
        popupIcon={<IoChevronDown size="18" color="#2F2F38" />}
        options={options}
        getOptionLabel={(option) => option.name}
        value={internalSelection}
        onChange={handleOptionChange}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderOption={(props, option, { selected: isSelected }) => {
          const { key, ...menuItemProps } = props
          const menuItemClassName = cx(
            menuItemProps.className,
            'rounded-none px-0 py-1',
          )

          if (option.id === -1) {
            return (
              <MenuItem
                key={key}
                {...menuItemProps}
                onClick={handleToggleAll}
                sx={{ minHeight: 32 }}
                className={menuItemClassName}
              >
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={!isAllSelected && internalSelection.length > 0}
                  size="small"
                  sx={{ py: 0 }}
                />
                <ListItemText primary="Select All / Deselect All" />
              </MenuItem>
            )
          }

          return (
            <MenuItem
              key={key}
              {...menuItemProps}
              disabled={option.disabled}
              sx={{ minHeight: 32 }}
              className={menuItemClassName}
            >
              <Checkbox
                checked={isSelected}
                disabled={option.disabled}
                size="small"
                sx={{ py: 0 }}
              />
              <ListItemText primary={option.name} />
            </MenuItem>
          )
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder="Click to select"
            inputProps={{
              ...params.inputProps,
            }}
          />
        )}
        renderTags={(value) => {
          const selectedCount = value.length
          return (
            <Typography variant="body2">
              {selectedCount > 0
                ? `${selectedCount} selected`
                : 'Choose options'}
            </Typography>
          )
        }}
        ListboxProps={{
          style: {
            maxHeight: '200px',
          },
        }}
        filterOptions={(options, state) => {
          if (!state.inputValue) {
            return [{ id: -1, name: 'Select All / Deselect All' }, ...options]
          }

          return options.filter(
            (option) =>
              option.name
                .toLowerCase()
                .includes(state.inputValue.toLowerCase()) && !option.disabled,
          )
        }}
      />
    </FormControl>
  )
}

export default MultiselectWithSelectAll
