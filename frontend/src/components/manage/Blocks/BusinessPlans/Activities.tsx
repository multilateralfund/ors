import React, { useMemo, useState } from 'react'

import { Tooltip, Typography } from '@mui/material'
import cx from 'classnames'

import styles from '@ors/components/manage/Blocks/Replenishment/Table/table.module.css'
import { IoChevronDown, IoChevronUp } from 'react-icons/io5'
import { formatDecimalValue } from '@ors/helpers'
import { tableColumns } from './constants'

interface Value {
  id: number
  value_mt: null | string
  value_co2: null | string
  value_odp: null | string
  value_usd: null | string
  year: number
  is_after: boolean
}

const generateYearRange = (period: string) => {
  const [min_year, max_year] = period.split('-').map(Number)
  return { max_year, min_year }
}

const generateTableData = (
  values: Value[],
  min_year: number,
  max_year: number,
) => {
  const years: (number | string)[] = []
  const usdValues: (number | string)[] = []
  const odpValues: (number | string)[] = []
  const mtValues: (number | string)[] = []
  const co2Values: (number | string)[] = []

  const afterMaxYearValues = {
    value_mt: 0,
    value_co2: 0,
    value_odp: 0,
    value_usd: 0,
  }

  for (let year = min_year; year <= max_year; year++) {
    years.push(year)

    const yearData = values.find((value) => value.year === year)
    usdValues.push(
      yearData && yearData.value_usd !== null
        ? parseFloat(yearData.value_usd)
        : '0.00',
    )
    odpValues.push(
      yearData && yearData.value_odp !== null
        ? parseFloat(yearData.value_odp)
        : '0.00',
    )
    mtValues.push(
      yearData && yearData.value_mt !== null
        ? parseFloat(yearData.value_mt)
        : '0.00',
    )
    co2Values.push(
      yearData && yearData.value_co2 !== null
        ? parseFloat(yearData.value_co2)
        : '0.00',
    )
  }

  values.forEach((value) => {
    if (value.is_after) {
      afterMaxYearValues.value_usd +=
        value.value_usd !== null ? parseFloat(value.value_usd) : 0
      afterMaxYearValues.value_odp +=
        value.value_odp !== null ? parseFloat(value.value_odp) : 0
      afterMaxYearValues.value_mt +=
        value.value_mt !== null ? parseFloat(value.value_mt) : 0
      afterMaxYearValues.value_co2 +=
        value.value_co2 !== null ? parseFloat(value.value_co2) : 0
    }
  })

  years.push(`After ${max_year}`)
  usdValues.push(afterMaxYearValues.value_usd)
  odpValues.push(afterMaxYearValues.value_odp)
  mtValues.push(afterMaxYearValues.value_mt)
  co2Values.push(afterMaxYearValues.value_co2)

  return {
    mtValues,
    co2Values,
    odpValues,
    usdValues,
    years,
  }
}

interface Props {
  isAllView: boolean
  isValuesView: boolean
  period: string
  values: Value[]
}

const ValuesTable: React.FC<Props> = ({
  isAllView,
  isValuesView,
  period,
  values,
}) => {
  const { max_year, min_year } = generateYearRange(period)

  const tableData = useMemo(
    () => generateTableData(values, min_year, max_year),
    [values, min_year, max_year],
  )

  const renderTable = (
    header: string,
    data: (number | string)[],
    isCo2?: boolean,
  ) => (
    <table className={cx(styles.replTable, '')}>
      <thead className="text-center">
        <tr>
          <th colSpan={tableData.years.length}>
            {isCo2 ? (
              <>
                CO<sub>2</sub>-EQ adjusted
              </>
            ) : (
              <div className="pb-1">{header}</div>
            )}
          </th>
        </tr>
        <tr>
          {tableData.years.map((year, index) => (
            <th key={index}>{year}</th>
          ))}
        </tr>
      </thead>
      <tbody className="text-center">
        <tr>
          {data.map((value, index) => (
            <td key={index}>
              <Tooltip
                TransitionProps={{ timeout: 0 }}
                placement={'bottom'}
                title={formatDecimalValue(parseFloat(value.toString()), {
                  maximumFractionDigits: 10,
                  minimumFractionDigits: 2,
                })}
              >
                <span>{formatDecimalValue(parseFloat(value.toString()))}</span>
              </Tooltip>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  )

  return (
    <div className="grid grid-cols-1 gap-4 border-0 border-b border-solid border-gray-200 pb-4 md:grid-cols-2 lg:grid-cols-3">
      {(isAllView || isValuesView) &&
        renderTable('Value ($000) adjusted', tableData.usdValues)}
      {(isAllView || !isValuesView) && (
        <>
          {renderTable('ODP adjusted', tableData.odpValues)}
          {renderTable('MT for HFC adjusted', tableData.mtValues)}
          {renderTable('CO2-EQ adjusted', tableData.co2Values, true)}
        </>
      )}
    </div>
  )
}

function OpenActivity({
  activity,
  displayAgency = false,
  gridOptions,
  period,
}: any) {
  const isValuesView = gridOptions === 'values'
  const isRemarksView = gridOptions === 'remarks'
  const isAllView = gridOptions === 'all' || !gridOptions

  return (
    <div className="transition-opacity flex w-full flex-col gap-4 opacity-100 duration-300 ease-in-out">
      <h4 className="m-0 flex items-center gap-4 border-0 border-b border-solid border-primary pb-4">
        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-solid border-primary bg-mlfs-hlYellowTint">
          <IoChevronDown className="text-primary" size={14} />
        </div>
        {activity.title}
      </h4>
      <div
        className={cx(
          'grid grid-cols-2 gap-y-4 border-0 pb-4 md:grid-cols-3 lg:grid-cols-4',
          {
            'border-b border-solid border-gray-200': isAllView || isRemarksView,
          },
        )}
      >
        <span className="flex items-center gap-2">
          <span>{tableColumns.country_id}</span>
          <h4 className="m-0">{activity.country.name}</h4>
        </span>
        {period && displayAgency && (
          <span className="flex items-center gap-2">
            <span>{tableColumns.agency_id}</span>
            <h4 className="m-0">{activity.agency.name}</h4>
          </span>
        )}
        <span className="flex items-center gap-2">
          <span>{tableColumns.lvc_status}</span>
          <h4 className="m-0">{activity.lvc_status || '-'}</h4>
        </span>
        <span className="flex items-center gap-2">
          <span>{tableColumns.project_type_id}</span>
          <h4 className="m-0">{activity.project_type?.code || '-'}</h4>
        </span>
        {isAllView && (
          <span className="flex items-center gap-2">
            <span>{tableColumns.bp_chemical_type_id}</span>
            <h4 className="m-0">{activity.bp_chemical_type?.name || '-'}</h4>
          </span>
        )}
        <span className="flex items-center gap-2">
          <span>{tableColumns.project_cluster_id}</span>
          <h4 className="m-0">{activity.project_cluster?.code || '-'}</h4>
        </span>
        <span className="flex items-center gap-2">
          <span>{tableColumns.sector_id}</span>
          <h4 className="m-0">{activity.sector?.code || '-'}</h4>
        </span>
        <span className="flex items-center gap-2">
          <span>{tableColumns.subsector_id}</span>
          <h4 className="m-0">{activity.subsector?.code || '-'}</h4>
        </span>
        {isAllView && (
          <span className="flex items-center gap-2">
            <span>{tableColumns.required_by_model}</span>
            <h4 className="m-0">{activity.required_by_model || '-'}</h4>
          </span>
        )}
        {(isAllView || isValuesView) && (
          <>
            <span className="flex items-center gap-2">
              <span>{tableColumns.status}</span>
              <h4 className="m-0">{activity.status_display}</h4>
            </span>

            <span className="flex items-center gap-2">
              <span>{tableColumns.is_multi_year}</span>
              <h4 className="m-0">
                {activity.is_multi_year ? 'Multi-Year' : 'Individual'}
              </h4>
            </span>
          </>
        )}
      </div>

      {isAllView && (
        <>
          <span className="flex flex-wrap items-center gap-2">
            <span className="mr-5">{tableColumns.substances}</span>
            {activity.substances_display.length > 0
              ? activity.substances_display.map(
                  (substance: string, index: number) => (
                    <Typography
                      key={index}
                      className="inline-flex items-center rounded-md border border-solid border-gray-200 bg-gray-100 px-1 text-sm font-medium"
                      component="p"
                      variant="h6"
                    >
                      {substance}
                    </Typography>
                  ),
                )
              : '-'}
          </span>
          <span className="flex items-center gap-4">
            <span>{tableColumns.amount_polyol}</span>
            <h4 className="m-0">
              {activity.amount_polyol
                ? formatDecimalValue(parseFloat(activity.amount_polyol), {
                    maximumFractionDigits: 10,
                    minimumFractionDigits: 2,
                  })
                : '0.00'}
            </h4>
          </span>
        </>
      )}

      {!isRemarksView && (
        <ValuesTable
          {...{ isAllView, isValuesView, period }}
          values={activity.values}
        />
      )}

      {(isAllView || isRemarksView) && (
        <>
          <div className="flex flex-wrap">
            <span className="flex w-1/2 flex-col gap-2.5 pr-1.5">
              <span>{tableColumns.remarks}</span>
              {activity.remarks ? (
                <div className="break-words rounded-lg bg-gray-100 p-4">
                  {activity.remarks}
                </div>
              ) : (
                <h4 className="m-0">-</h4>
              )}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function ClosedActivity({
  activity,
  displayAgency = false,
  gridOptions,
  period,
}: any) {
  const isAllView = gridOptions === 'all' || !gridOptions

  return (
    <div className="transition-opacity flex w-full flex-col-reverse justify-between gap-4 opacity-100 duration-300 ease-in-out lg:flex-row">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-solid border-primary bg-mlfs-hlYellowTint">
          <IoChevronUp className="text-primary" size={14} />
        </div>
        <span className="flex items-center gap-2">
          <span>{tableColumns.country_id}</span>
          <h4 className="m-0">{activity.country.name}</h4>
        </span>
        {period && displayAgency && (
          <span className="flex items-center gap-2">
            <span>{tableColumns.agency_id}</span>
            <h4 className="m-0">{activity.agency.name}</h4>
          </span>
        )}
        <span className="flex items-center gap-2">
          <span>{tableColumns.lvc_status}</span>
          <h4 className="m-0">{activity.lvc_status || '-'} </h4>
        </span>
        <span className="flex items-center gap-2">
          <span>{tableColumns.project_type_id}</span>
          <h4 className="m-0">{activity.project_type?.code || '-'}</h4>
        </span>
        {isAllView && (
          <span className="flex items-center gap-2">
            <span>{tableColumns.bp_chemical_type_id}</span>
            <h4 className="m-0">{activity.bp_chemical_type?.name || '-'}</h4>
          </span>
        )}
        <span className="flex items-center gap-2">
          <span>{tableColumns.project_cluster_id}</span>
          <h4 className="m-0">{activity.project_cluster?.code || '-'}</h4>
        </span>
        <span className="flex items-center gap-2">
          <span>{tableColumns.sector_id}</span>
          <h4 className="m-0">{activity.sector?.code || '-'}</h4>
        </span>
        <span className="flex items-center gap-2">
          <span>{tableColumns.subsector_id}</span>
          <h4 className="m-0">{activity.subsector?.code || '-'}</h4>
        </span>
      </div>
      <h4 className="m-0">{activity.title}</h4>
    </div>
  )
}

function Activity(props: any) {
  const [open, setOpen] = useState(false)

  return (
    <li
      className="transition-transform w-full transform cursor-pointer rounded-lg p-4 duration-300 ease-in-out"
      style={{ boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.2)' }}
      onClick={() => setOpen(!open)}
    >
      {open ? <OpenActivity {...props} /> : <ClosedActivity {...props} />}
    </li>
  )
}

export default function Activities(props: any) {
  const { results, ...rest } = props

  return (
    <ul className="m-0 flex list-none flex-col gap-6 pl-0">
      {results.map((activity: any) => (
        <Activity key={activity.id} activity={activity} {...rest} />
      ))}
      {results.length === 0 && (
        <Typography component="h1" variant="h5">
          No data available.
        </Typography>
      )}
    </ul>
  )
}
