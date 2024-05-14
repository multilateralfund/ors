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

import { formatApiUrl } from '@ors/helpers'
import { useStore } from '@ors/store'

import { IoInformationCircleOutline } from 'react-icons/io5'

const CPExport = () => {
  const settings = useStore((state) => state.common.settings.data)

  const [exportOption, setExportOption] = React.useState('')
  const [year, setYear] = React.useState('currentYear')
  const [minYear, setMinYear] = React.useState('')
  const [maxYear, setMaxYear] = React.useState('')

  const updateDownloadUrl = (
    year?: string,
    minYear?: string,
    maxYear?: string,
  ) => {
    let apiUrl = ''

    if (minYear && maxYear && parseInt(minYear) > parseInt(maxYear)) {
      return null
    }

    const yearParam = year === 'currentYear' ? '' : `?year=${year}`
    const minYearParam = minYear ? `min_year=${parseInt(minYear)}` : ''
    const maxYearParam = maxYear ? `max_year=${parseInt(maxYear)}` : ''

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

    const queryParams = exportOption.includes('all')
      ? yearParam
      : minYear && maxYear
        ? `?${minYearParam}&${maxYearParam}`
        : `?${minYearParam}` || `?${maxYearParam}` || ''

    return apiUrl + queryParams
  }

  const downloadUrl = updateDownloadUrl(year, minYear, maxYear)

  const handleExportOptionChange = (event: SelectChangeEvent<string>) => {
    const selectedOption = event.target.value
    setExportOption(selectedOption)

    if (selectedOption.includes('all')) {
      setYear('currentYear')
    } else if (
      selectedOption.includes('HCFC') ||
      selectedOption.includes('HFC')
    ) {
      setMinYear('')
      setMaxYear('')
    }
  }

  const handleYearChange = (event: SelectChangeEvent<string>) => {
    setYear(event.target.value)
  }

  const handleMinYearChange = (event: SelectChangeEvent<string>) => {
    setMinYear(event.target.value)
  }

  const handleMaxYearChange = (event: SelectChangeEvent<string>) => {
    setMaxYear(event.target.value)
  }

  // Create year options from settings.cp_reports.min_year to settings.cp_reports.max_year
  const yearOptions = []
  for (
    let i = settings.cp_reports.min_year;
    i <= settings.cp_reports.max_year;
    i++
  ) {
    yearOptions.push(i.toString()) // Ensure it's a string
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert icon={<IoInformationCircleOutline size={24} />} severity="info">
        <Typography variant="h6">
          Choose from the available types of extractions from the list below.
        </Typography>
      </Alert>

      <div className="flex flex-wrap items-center justify-start gap-4">
        {/* Export options */}
        <FormControl className="w-1/3 min-w-52">
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
          <FormControl className="w-1/3 min-w-28">
            <label htmlFor="year">Year</label>
            <Select
              id="year"
              placeholder="Select a year"
              size="small"
              value={year}
              MenuProps={{
                sx: { maxHeight: 400 },
              }}
              onChange={handleYearChange}
            >
              <MenuItem key={'currentYear'} value={'currentYear'}>
                Current Year
              </MenuItem>
              {yearOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Min/Max year select */}
        {exportOption &&
          (exportOption.includes('HCFC') || exportOption.includes('HFC')) && (
            <>
              <FormControl className="w-1/4 min-w-28">
                <label htmlFor="min-year">Min Year</label>
                <Select
                  id="min-year"
                  placeholder="Select a min year"
                  size="small"
                  value={minYear}
                  MenuProps={{
                    sx: { maxHeight: 400 },
                  }}
                  onChange={handleMinYearChange}
                >
                  {yearOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl className="w-1/4 min-w-28">
                <label htmlFor="max-year">Max Year</label>
                <Select
                  id="max-year"
                  placeholder="Select a max year"
                  size="small"
                  value={maxYear}
                  MenuProps={{
                    sx: { maxHeight: 400 },
                  }}
                  onChange={handleMaxYearChange}
                >
                  {yearOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}

        {downloadUrl && (
          <a className="min-w-20 self-end" href={formatApiUrl(downloadUrl)}>
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
