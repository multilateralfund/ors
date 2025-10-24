import { Box, Button, Divider } from '@mui/material'
import Field from '@ors/components/manage/Form/Field'
import { formatApiUrl, formatDecimalValue } from '@ors/helpers'
import useApi from '@ors/hooks/useApi.ts'
import cx from 'classnames'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { IoChevronDown } from 'react-icons/io5'
import Link from '@ors/components/ui/Link/Link.tsx'
import SummaryOfProjectsFilters from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/SummaryOfProjectsFilters.tsx'
import {
  ApiFilterOption,
  ApiSummaryOfProjects,
  ApiSummaryOfProjectsFilters,
  GlobalRequestParams,
  RequestParams,
  RowData,
} from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/types.ts'
import {
  initialGlobalRequestParams,
  initialRowData,
} from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/initialData.ts'
import IntrinsicElements = React.JSX.IntrinsicElements
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'

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
    <div className="flex gap-x-2">
      <Label htmlFor={`#filter${label}`} className="w-32">
        {label}
      </Label>
      <Field
        id={`#filter${label}`}
        Input={{ placeholder: `Click to select` }}
        options={options}
        widget="autocomplete"
        onChange={(_: any, value: any) => {
          const castValue = value as ApiFilterOption | null
          onChange(castValue?.id.toString() ?? '')
        }}
        {...defaultProps}
      />
    </div>
  )
}

const SummaryOfProjectsRow = (props: {
  rowData: RowData
  setRowData: (updater: RowData | ((prevRowData: RowData) => RowData)) => void
  rowFilters: ApiSummaryOfProjectsFilters
  globalRequestParams: GlobalRequestParams
}) => {
  const { rowFilters, rowData, setRowData, globalRequestParams } = props

  const summaryOfProjectsApi = useApi<ApiSummaryOfProjects>({
    path: 'api/summary-of-projects',
    options: {
      // triggerIf: false,
      params: { ...globalRequestParams, ...rowData.params },
      withStoreCache: false,
    },
    onSuccess: (data: ApiSummaryOfProjects) => {
      setRowData((prevRowData) => ({ ...prevRowData, apiData: data }))
    },
  })

  useEffect(() => {
    summaryOfProjectsApi.setParams(globalRequestParams)
  }, [globalRequestParams])

  const handleFilterChanged = useCallback(
    (paramName: keyof RequestParams) => {
      return (value: string) => {
        setRowData((prevRowData) => ({
          ...prevRowData,
          params: { ...prevRowData.params, [paramName]: value },
        }))
        summaryOfProjectsApi.setParams({ [paramName]: value })
        summaryOfProjectsApi.setApiSettings((prev) => ({
          ...prev,
          options: { ...prev.options, triggerIf: true },
        }))
      }
    },
    [summaryOfProjectsApi, setRowData],
  )

  return (
    <div className="table-row">
      <TableCell>
        <textarea
          value={rowData.text}
          onChange={(evt) =>
            setRowData((prevRowData) => ({
              ...prevRowData,
              text: evt.target.value,
            }))
          }
        ></textarea>
      </TableCell>
      <TableCell>
        <div className="flex w-[20rem] flex-col gap-2">
          <FilterField
            label="Country"
            options={rowFilters.country}
            onChange={handleFilterChanged('country_id')}
          />
          <FilterField
            label="Cluster"
            options={rowFilters.cluster}
            onChange={handleFilterChanged('cluster_id')}
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
  rows: RowData[]
  setRows: React.Dispatch<React.SetStateAction<RowData[]>>
  rowFilters: ApiSummaryOfProjectsFilters
  globalRequestParams: GlobalRequestParams
}) => {
  const { rows, rowFilters, setRows, globalRequestParams } = props

  const setRow = useCallback(
    (idx: number) => (updater: RowData | ((prevRowData: RowData) => RowData)) =>
      setRows((prevState) => {
        const newRows = [...prevState]
        if (typeof updater === 'function') {
          newRows[idx] = updater(newRows[idx])
        } else {
          newRows[idx] = updater
        }
        return newRows
      }),
    [setRows],
  )

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
      {rows.map((row, i) => (
        <SummaryOfProjectsRow
          key={i}
          rowFilters={rowFilters}
          rowData={row}
          setRowData={setRow(i)}
          globalRequestParams={globalRequestParams}
        />
      ))}
      {rows.length ? (
        <div className="table-row">
          <TableCell>Total</TableCell>
          <TableCell></TableCell>
          <TableCell></TableCell>
          <TableCell>
            {rows
              .map((r) => r.apiData?.projects_count ?? 0)
              .reduce((acc, v) => acc + v, 0)}
          </TableCell>
          <TableCell>
            {formatDecimalValue(
              rows
                .map((r) => r.apiData?.amounts_recommended ?? 0)
                .reduce((acc, v) => acc + v, 0),
            )}
          </TableCell>
          <TableCell></TableCell>
        </div>
      ) : null}
    </div>
  )
}

const SummaryOfProjects = () => {
  const [globalRequestParams, setGlobalRequestParams] =
    useState<GlobalRequestParams>(initialGlobalRequestParams())
  const [rows, setRows] = useState<RowData[]>([initialRowData()])
  const addRow = () => {
    setRows((prevState) => [...prevState, initialRowData()])
  }
  const removeRow = () => {
    setRows((prevState) => prevState.slice(0, prevState.length - 1))
  }

  const rowFiltersApi = useApi<ApiSummaryOfProjectsFilters>({
    options: {
      params: globalRequestParams,
    },
    path: 'api/summary-of-projects/filters',
  })

  useEffect(() => {
    rowFiltersApi.setParams(globalRequestParams)
  }, [globalRequestParams])

  const rowFilters = useMemo(() => {
    if (rowFiltersApi.loaded && rowFiltersApi.data) {
      return rowFiltersApi.data
    }
    return null
  }, [rowFiltersApi.loaded, rowFiltersApi.data])

  const downloadUrl = useMemo(() => {
    const validRowData = rows.map((row) => {
      // Filter out parameters with falsy values to reduce encoded size.
      const params = Object.fromEntries(
        Object.entries(row.params).filter(([_, value]) => value),
      )
      return { ...row, params: params }
    })
    const b64rowData = btoa(JSON.stringify(validRowData))
    const encodedParams = new URLSearchParams({
      row_data: b64rowData,
    }).toString()
    return formatApiUrl(`api/summary-of-projects/export?${encodedParams}`)
  }, [rows])

  return (
    <>
      <Box className="shadow-none">
        {rowFilters && (
          <>
            <SummaryOfProjectsFilters
              requestParams={globalRequestParams}
              setRequestParams={setGlobalRequestParams}
            />
            <Divider className="my-2 border-0" />
            <SummaryOfProjectsTable
              rowFilters={rowFilters}
              globalRequestParams={globalRequestParams}
              rows={rows}
              setRows={setRows}
            />
            <div className="mt-4 flex gap-x-2">
              <Button size="large" variant="contained" onClick={addRow}>
                Add row
              </Button>
              <Button
                size="large"
                variant="contained"
                onClick={removeRow}
                disabled={rows.length === 0}
              >
                Remove row
              </Button>
              <Link
                button
                disabled={!rows.filter((row) => row.text).length}
                size="large"
                href={downloadUrl}
                variant="contained"
              >
                Download summary
              </Link>
            </div>
          </>
        )}
      </Box>
    </>
  )
}

export default SummaryOfProjects
