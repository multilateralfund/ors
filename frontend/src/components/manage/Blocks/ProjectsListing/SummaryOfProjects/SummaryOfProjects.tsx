import { Box, Button } from '@mui/material'
import Field from '@ors/components/manage/Form/Field'
import { formatDecimalValue } from '@ors/helpers'
import useApi from '@ors/hooks/useApi.ts'
import cx from 'classnames'
import React, { useCallback, useMemo, useState } from 'react'
import { IoChevronDown } from 'react-icons/io5'
import IntrinsicElements = React.JSX.IntrinsicElements

type ApiSummaryOfProjects = {
  projects_count: number
  countries_count: number
  amounts_in_principle: number
  amounts_recommended: number
}

type ApiSummaryOfProjectsFilters = {
  country: ApiFilterOption[]
  cluster: ApiFilterOption[]
  project_type: ApiFilterOption[]
  sector: ApiFilterOption[]
  agency: ApiFilterOption[]
  tranche: ApiFilterOption[]
}

type ApiFilterOption = {
  name: string
  id: number
}

const defaultProps = {
  FieldProps: { className: 'mb-0 w-full' },
  popupIcon: <IoChevronDown size="18" color="#2F2F38" />,
  getOptionLabel: (option: any) => option?.name,
  componentsProps: {
    popupIndicator: {
      sx: {
        transform: 'none !important',
      },
    },
  },
}

const initialRequestParams = () => ({
  cluster_id: '',
  country_id: '',
  project_type_id: '',
  sector_id: '',
  agency_id: '',
  tranche: '',
})

const TableCell = ({ className, children }: IntrinsicElements['div']) => {
  return (
    <div
      className={cx(
        'table-cell border border-solid border-primary p-2 align-top',
        className,
      )}
    >
      {children}
    </div>
  )
}

const FilterField = (props: {
  label: string
  options: ApiFilterOption[]
  onChange: (value: string) => void
}) => {
  const { options, label, onChange } = props
  return (
    <Field
      Input={{ placeholder: label }}
      options={options}
      widget="autocomplete"
      onChange={(_: any, value: any) => {
        const castValue = value as ApiFilterOption | null
        onChange(castValue?.id.toString() ?? '')
      }}
      {...defaultProps}
    />
  )
}

const SummaryOfProjectsRow = (props: {
  rowFilters: ApiSummaryOfProjectsFilters
}) => {
  const { rowFilters } = props
  const [requestParams, setRequestParams] = useState(initialRequestParams)

  const summaryOfProjectsApi = useApi<ApiSummaryOfProjects>({
    path: 'api/summary-of-projects',
    options: {
      // triggerIf: false,
      params: requestParams,
      withStoreCache: false,
    },
  })

  const handleFilterChanged = useCallback(
    (paramName: keyof ReturnType<typeof initialRequestParams>) => {
      return (value: string) => {
        console.log('Changing value of ', paramName, value)
        summaryOfProjectsApi.setParams({ [paramName]: value })
        summaryOfProjectsApi.setApiSettings((prev) => ({
          ...prev,
          options: { ...prev.options, triggerIf: true },
        }))
      }
    },
    [summaryOfProjectsApi],
  )

  return (
    <div className="table-row">
      <TableCell>
        <textarea></textarea>
      </TableCell>
      <TableCell>
        <div className="flex w-[20rem] flex-col gap-2">
          <FilterField
            label="Cluster"
            options={rowFilters.cluster}
            onChange={handleFilterChanged('cluster_id')}
          />
          <FilterField
            label="Country"
            options={rowFilters.country}
            onChange={handleFilterChanged('country_id')}
          />
          <FilterField
            label="Type"
            options={rowFilters.project_type}
            onChange={handleFilterChanged('project_type_id')}
          />
          <FilterField
            label="Sector"
            options={rowFilters.sector}
            onChange={handleFilterChanged('sector_id')}
          />
          <FilterField
            label="Agency"
            options={rowFilters.agency}
            onChange={handleFilterChanged('agency_id')}
          />
          <FilterField
            label="Tranche"
            options={rowFilters.tranche}
            onChange={handleFilterChanged('tranche')}
          />
        </div>
      </TableCell>
      <TableCell>{summaryOfProjectsApi.data?.countries_count ?? '-'}</TableCell>
      <TableCell>{summaryOfProjectsApi.data?.projects_count ?? '-'}</TableCell>
      <TableCell>
        {formatDecimalValue(
          summaryOfProjectsApi.data?.amounts_recommended ?? 0,
        )}
      </TableCell>
      <TableCell>
        {formatDecimalValue(
          summaryOfProjectsApi.data?.amounts_in_principle ?? 0,
        )}
      </TableCell>
    </div>
  )
}

const SummaryOfProjectsTable = (props: {
  rows: Record<string, string>[]
  rowFilters: ApiSummaryOfProjectsFilters
}) => {
  const { rows, rowFilters } = props
  return (
    <div className="table w-full border-collapse">
      <div className="table-header-group font-bold">
        <div className="table-row">
          <TableCell>Projects and activities</TableCell>
          <TableCell>Context by row</TableCell>
          <TableCell>No. of countries</TableCell>
          <TableCell>No. of funding requests</TableCell>
          <TableCell>
            Amounts recommended <br />
            (US $)
          </TableCell>
          <TableCell>
            Amounts in principle <br />
            (US $)
          </TableCell>
        </div>
      </div>
      {rows.map((r, i) => (
        <SummaryOfProjectsRow key={i} rowFilters={rowFilters} />
      ))}
    </div>
  )
}

const SummaryOfProjects = () => {
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const addRow = () => {
    setRows((prevState) => [...prevState, {}])
  }
  const removeRow = () => {
    setRows((prevState) => prevState.slice(0, prevState.length - 1))
  }

  const rowFiltersApi = useApi<ApiSummaryOfProjectsFilters>({
    options: {},
    path: 'api/summary-of-projects/filters',
  })

  const rowFilters = useMemo(() => {
    if (rowFiltersApi.loaded && rowFiltersApi.data) {
      return rowFiltersApi.data
    }
    return null
  }, [rowFiltersApi.loaded, rowFiltersApi.data])

  return (
    <>
      <Box className="shadow-none">
        {rowFilters && (
          <>
            <SummaryOfProjectsTable rowFilters={rowFilters} rows={rows} />
            <div className="mt-4 flex gap-x-2">
              <Button size="large" variant="contained" onClick={addRow}>
                Add row
              </Button>
              <Button size="large" variant="contained" onClick={removeRow}>
                Remove row
              </Button>
            </div>
          </>
        )}
      </Box>
    </>
  )
}

export default SummaryOfProjects
