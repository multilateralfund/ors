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

const updateDownloadUrl = (
  exportOption: string,
  year?: null | number,
  minYear?: null | number,
  maxYear?: null | number,
) => {
  let apiUrl = ''

  if (minYear && maxYear && minYear > maxYear) {
    return null
  }

  const yearParam = year === null ? '' : `year=${year}`
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
    default:
      return
  }

  let queryParams = exportOption.includes('all')
    ? yearParam
    : minYear && maxYear
      ? `${minYearParam}&${maxYearParam}`
      : `${minYearParam}` || `${maxYearParam}` || ''

  queryParams = queryParams ? `?${queryParams}` : ''

  return apiUrl + queryParams
}

const CPExport = () => {
  const settings = useStore((state) => state.common.settings.data)

  const [exportOption, setExportOption] = React.useState('')
  const [year, setYear] = React.useState<null | number>(null)
  const [minYear, setMinYear] = React.useState<null | number>(null)
  const [maxYear, setMaxYear] = React.useState<null | number>(null)

  const calculatedMinYear = settings.cp_reports.min_year
  const calculatedMaxYear = settings.cp_reports.max_year

  const downloadUrl = updateDownloadUrl(exportOption, year, minYear, maxYear)

  const handleExportOptionChange = (event: SelectChangeEvent<string>) => {
    const selectedOption = event.target.value
    setExportOption(selectedOption)

    if (selectedOption.includes('all')) {
      setYear(null)
    } else if (
      selectedOption.includes('HCFC') ||
      selectedOption.includes('HFC')
    ) {
      setMinYear(null)
      setMaxYear(null)
    }
  }

  const yearOptions = []
  for (
    let i = settings.cp_reports.min_year;
    i <= settings.cp_reports.max_year;
    i++
  ) {
    yearOptions.push({ id: i, label: i.toString(), value: i })
  }

  const minYearOptions = yearOptions.filter(
    (year) => year.value < (maxYear || calculatedMaxYear),
  )

  const maxYearOptions = yearOptions.filter(
    (year) => year.value > (minYear || calculatedMinYear),
  )

  return (
    <div className="CPExport flex flex-col gap-8 md:gap-4">
      <Alert icon={<IoInformationCircleOutline size={24} />} severity="info">
        <Typography variant="h6">
          Choose from the available types of extractions from the list below.
        </Typography>
      </Alert>

      <div className="flex flex-col flex-wrap gap-8 md:gap-4 md:flex-row md:items-end md:justify-start">
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
          </Select>
        </FormControl>

        {/* Year Select */}
        {exportOption && exportOption.includes('all') && (
          <div className="flex w-full md:w-1/3 md:min-w-52 flex-col">
            <label htmlFor="year">
              Year&nbsp;
              <span className="text-sm text-gray-500">
                (This field is optional)
              </span>
            </label>
            <Field
              id="year"
              FieldProps={{ className: 'mb-0' }}
              options={yearOptions}
              widget="autocomplete"
              Input={{
                placeholder: 'Select year...',
              }}
              isOptionEqualToValue={(option, value) =>
                option?.value === value?.value
              }
              value={
                year ? { id: year, label: year?.toString(), value: year } : null
              }
              onChange={(_, option: any) => {
                setYear(option?.value || null)
              }}
            />
          </div>
        )}

        {/* Min/Max year select */}
        {exportOption &&
          (exportOption.includes('HCFC') || exportOption.includes('HFC')) && (
            <>
              <div className="flex w-full md:w-1/4 md:min-w-28 flex-col">
                <label htmlFor="min-year">
                  Min Year&nbsp;
                  <span className="text-sm text-gray-500">
                    (This field is optional)
                  </span>
                </label>

                <Field
                  id="min-year"
                  FieldProps={{ className: 'mb-0' }}
                  options={minYearOptions}
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
                    setMinYear(option?.value || null)
                  }}
                />
              </div>
              <div className="flex w-full md:w-1/4 md:min-w-28 flex-col">
                <label htmlFor="max-year">
                  Max Year&nbsp;
                  <span className="text-sm text-gray-500">
                    (This field is optional)
                  </span>
                </label>
                <Field
                  id="max-year"
                  FieldProps={{ className: 'mb-0' }}
                  options={maxYearOptions}
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
                    setMaxYear(option?.value || null)
                  }}
                />
              </div>
            </>
          )}

        {downloadUrl && (
          <a className="md:min-w-20 md:self-end" href={formatApiUrl(downloadUrl)}>
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
