import { IoChevronDown } from 'react-icons/io5'
import React, {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import {
  ApiFilterOption,
  GlobalRequestParams,
  RequestParams,
  RowData,
} from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/types.ts'
import useRowFilters from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/useRowFilters.ts'
import useSummaryOfProjects from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/useSummaryOfProjects.ts'
import { formatDecimalValue } from '@ors/helpers'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers.tsx'
import Field from '@ors/components/manage/Form/Field.tsx'
import { default as TableCell } from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/SummaryOfProjectsTableCell.tsx'

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
const FilterField = (props: {
  label: string
  options: ApiFilterOption[]
  onChange: (value: string) => void
  value: any
}) => {
  const { options, label, value, onChange } = props
  return (
    <div className="flex gap-x-2">
      <Label htmlFor={`#filter${label}`} className="w-32">
        {label}
      </Label>
      <Field
        id={`#filter${label}`}
        Input={{ placeholder: `Click to select` }}
        options={options}
        value={
          options.filter((option) => option.id === parseInt(value, 10))[0] ??
          null
        }
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

type SummaryOfProjectsRowProps = {
  rowData: RowData
  setRowData: (updater: RowData | ((prevRowData: RowData) => RowData)) => void
  globalRequestParams: GlobalRequestParams
}

const SummaryOfProjectsRow = (props: SummaryOfProjectsRowProps) => {
  const { rowData, setRowData, globalRequestParams } = props

  const { rowFilters, setRowFiltersParams } = useRowFilters(globalRequestParams)

  const { params: rowApiParams } = rowData

  const apiParams = useMemo(
    () => ({ ...globalRequestParams, ...rowApiParams }),
    [globalRequestParams, rowApiParams],
  )

  useEffect(() => {
    setRowFiltersParams(apiParams)
  }, [setRowFiltersParams, apiParams])

  const {
    summaryOfProjectsData,
    summaryOfProjectsSetApiSettings,
    summaryOfProjectsSetParams,
  } = useSummaryOfProjects(apiParams)

  useEffect(() => {
    setRowData((prevRowData) => ({
      ...prevRowData,
      apiData: summaryOfProjectsData,
    }))
  }, [setRowData, summaryOfProjectsData])

  useEffect(() => {
    summaryOfProjectsSetParams(globalRequestParams)
  }, [summaryOfProjectsSetParams, globalRequestParams])

  const handleFilterChanged = useCallback(
    (paramName: keyof RequestParams) => {
      return (value: string) => {
        setRowData((prevRowData) => ({
          ...prevRowData,
          params: { ...prevRowData.params, [paramName]: value },
        }))
        summaryOfProjectsSetParams({ [paramName]: value })
        summaryOfProjectsSetApiSettings((prev) => ({
          ...prev,
          options: { ...prev.options, triggerIf: true },
        }))
      }
    },
    [summaryOfProjectsSetParams, summaryOfProjectsSetApiSettings, setRowData],
  )

  const updateText: ChangeEventHandler<HTMLTextAreaElement> = (evt) => {
    setRowData((prevRowData) => ({
      ...prevRowData,
      text: evt.target.value,
    }))
  }

  return (
    <div className="table-row">
      <TableCell>
        <textarea
          className="sm:w-[400px] md:w-[500px] xl:w-[1000px]"
          rows={20}
          value={rowData.text}
          onChange={updateText}
        ></textarea>
      </TableCell>
      <TableCell>
        {rowFilters ? (
          <div className="flex w-[20rem] flex-col gap-2">
            <FilterField
              label="Country"
              options={rowFilters.country}
              onChange={handleFilterChanged('country_id')}
              value={rowData.params.country_id}
            />
            <FilterField
              label="Cluster"
              options={rowFilters.cluster}
              onChange={handleFilterChanged('cluster_id')}
              value={rowData.params.cluster_id}
            />
            <FilterField
              label="Type"
              options={rowFilters.project_type}
              onChange={handleFilterChanged('project_type_id')}
              value={rowData.params.project_type_id}
            />
            <FilterField
              label="Sector"
              options={rowFilters.sector}
              onChange={handleFilterChanged('sector_id')}
              value={rowData.params.sector_id}
            />
            <FilterField
              label="Agency"
              options={rowFilters.agency}
              onChange={handleFilterChanged('agency_id')}
              value={rowData.params.agency_id}
            />
            <FilterField
              label="Tranche"
              options={rowFilters.tranche}
              onChange={handleFilterChanged('tranche')}
              value={rowData.params.tranche}
            />
          </div>
        ) : null}
      </TableCell>
      <TableCell>{summaryOfProjectsData?.countries_count ?? '-'}</TableCell>
      <TableCell>{summaryOfProjectsData?.projects_count ?? '-'}</TableCell>
      <TableCell>
        {formatDecimalValue(summaryOfProjectsData?.amounts_recommended ?? 0)}
      </TableCell>
      <TableCell>
        {formatDecimalValue(summaryOfProjectsData?.amounts_in_principle ?? 0)}
      </TableCell>
    </div>
  )
}

type SummaryOfProjectsRowWrapperProps = {
  rowIdx: number
  setRow: (idx: number) => SummaryOfProjectsRowProps['setRowData']
} & Omit<SummaryOfProjectsRowProps, 'setRowData'>

const SummaryOfProjectsRowWrapper = (
  props: SummaryOfProjectsRowWrapperProps,
) => {
  const { rowIdx, setRow, ...rest } = props

  const setRowData = useMemo(() => setRow(rowIdx), [setRow, rowIdx])

  return <SummaryOfProjectsRow {...rest} setRowData={setRowData} />
}

export default SummaryOfProjectsRowWrapper
