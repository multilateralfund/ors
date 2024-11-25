'use client'
import React from 'react'

import {
  Alert,
  Button,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from '@mui/material'

import Field from '@ors/components/manage/Form/Field'
import { formatApiUrl } from '@ors/helpers'
import { useStore } from '@ors/store'

import { IoInformationCircleOutline } from 'react-icons/io5'

const OPT_SUBMISSION_LOG = 'Submission log'

const updateDownloadUrl = (
  exportOption: string,
  minYear?: null | number,
  maxYear?: null | number,
) => {
  let apiUrl = ''

  if (minYear && maxYear && minYear > maxYear) {
    return null
  }

  const minYearParam = minYear ? `min_year=${minYear}` : ''
  const maxYearParam = maxYear ? `max_year=${maxYear}` : ''

  switch (exportOption) {
    case 'CP data extraction - all':
      apiUrl = '/api/country-programme/data-extraction-all/export/'
      break
    case 'CP data extraction - HCFC':
    case 'CP data extraction - HFC':
      apiUrl = exportOption.includes('HCFC')
        ? '/api/country-programme/hcfc/export/'
        : '/api/country-programme/hfc/export/'
      break
    case OPT_SUBMISSION_LOG:
      apiUrl = '/api/country-programme/reports/export/'
      break
    default:
      return
  }

  let queryParams =
    minYear && maxYear
      ? `${minYearParam}&${maxYearParam}`
      : `${minYearParam}` || `${maxYearParam}` || ''

  queryParams = queryParams ? `?${queryParams}` : ''

  return apiUrl + queryParams
}

const CPExport = () => {
  const settings = useStore((state) => state.common.settings.data)

  const [exportOption, setExportOption] = React.useState('')
  const [minYear, setMinYear] = React.useState<null | number>(null)
  const [maxYear, setMaxYear] = React.useState<null | number>(null)

  const downloadUrl = updateDownloadUrl(exportOption, minYear, maxYear)

  const handleExportOptionChange = (event: SelectChangeEvent<string>) => {
    const selectedOption = event.target.value
    setExportOption(selectedOption)

    setMinYear(null)
    setMaxYear(null)
  }

  const yearOptions = []
  for (
    let i = settings.cp_reports.min_year;
    i <= settings.cp_reports.max_year;
    i++
  ) {
    yearOptions.push({ id: i, label: i.toString(), value: i })
  }
  const reversedYearOptions = [...yearOptions].reverse()

  return (
    <div className="CPExport flex flex-col gap-8 md:gap-4">
      <Alert icon={<IoInformationCircleOutline size={24} />} severity="info">
        <Typography variant="h6">
          Choose from the available types of extractions from the list below.
        </Typography>
      </Alert>

      <div className="flex flex-col flex-wrap gap-8 md:flex-row md:items-end md:justify-start md:gap-4">
        {/* Export options */}
        <FormControl className="w-full md:w-1/3 md:min-w-52">
          <label htmlFor="export-option">Select an export option</label>
          <Select
            id="export-option"
            placeholder="Select an export option"
            size="small"
            value={exportOption}
            onChange={handleExportOptionChange}
          >
            <MenuItem value="CP data extraction - all">
              CP data extraction - all
            </MenuItem>
            <MenuItem value="CP data extraction - HCFC">
              CP data extraction - HCFC
            </MenuItem>
            <MenuItem value="CP data extraction - HFC">
              CP data extraction - HFC
            </MenuItem>
            <MenuItem value={OPT_SUBMISSION_LOG}>{OPT_SUBMISSION_LOG}</MenuItem>
          </Select>
        </FormControl>

        {/* Min/Max year select */}
        {exportOption && (
          <>
            <div className="flex w-full flex-col md:w-1/4 md:min-w-28">
              <label htmlFor="min-year">
                Min Year&nbsp;
                <span className="text-sm text-gray-500">
                  (This field is optional)
                </span>
              </label>

              <Field
                id="min-year"
                FieldProps={{ className: 'mb-0' }}
                options={reversedYearOptions}
                widget="autocomplete"
                Input={{
                  placeholder: 'Select min year...',
                }}
                isOptionEqualToValue={(option, value) =>
                  option?.value === value?.value
                }
                value={
                  minYear
                    ? {
                        id: minYear,
                        label: minYear?.toString(),
                        value: minYear,
                      }
                    : null
                }
                onChange={(_, option: any) => {
                  if (option === null) {
                    setMinYear(null)
                    return
                  }
                  if (option?.value && maxYear && option.value > maxYear) {
                    setMaxYear(option.value)
                  }
                  setMinYear(option.value)
                }}
              />
            </div>
            <div className="flex w-full flex-col md:w-1/4 md:min-w-28">
              <label htmlFor="max-year">
                Max Year&nbsp;
                <span className="text-sm text-gray-500">
                  (This field is optional)
                </span>
              </label>
              <Field
                id="max-year"
                FieldProps={{ className: 'mb-0' }}
                options={reversedYearOptions}
                widget="autocomplete"
                Input={{
                  placeholder: 'Select max year...',
                }}
                isOptionEqualToValue={(option, value) =>
                  option?.value === value?.value
                }
                value={
                  maxYear
                    ? {
                        id: maxYear,
                        label: maxYear?.toString(),
                        value: maxYear,
                      }
                    : null
                }
                onChange={(_, option: any) => {
                  if (option === null) {
                    setMaxYear(null)
                    return
                  }
                  if (option?.value && minYear && option.value < minYear) {
                    setMinYear(option.value)
                  }
                  setMaxYear(option.value)
                }}
              />
            </div>
          </>
        )}

        {downloadUrl && (
          <a
            className="md:min-w-20 md:self-end"
            href={formatApiUrl(downloadUrl)}
          >
            <Button className="w-full" variant="contained">
              Export
            </Button>
          </a>
        )}
      </div>
    </div>
  )
}

export default CPExport
