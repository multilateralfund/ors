import { Box, Button, Divider } from '@mui/material'
import { IoChevronDown } from 'react-icons/io5'
import React, { Suspense, useMemo, useState } from 'react'
import useApi from '@ors/hooks/useApi.ts'
import { ApiApprovalSummary } from '@ors/types/api_approval_summary.ts'
import { formatDecimalValue } from '@ors/helpers'
import IntrinsicElements = React.JSX.IntrinsicElements
import cx from 'classnames'

const defaultProps = {
  FieldProps: { className: 'mb-0 w-full' },
  popupIcon: <IoChevronDown size="18" color="#2F2F38" />,
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
})

const TableCell = ({ className, children }: IntrinsicElements['div']) => {
  return (
    <div
      className={cx(
        'table-cell border border-solid border-primary p-2',
        className,
      )}
    >
      {children}
    </div>
  )
}

type SummaryOfProjectsRow = {
  rowFilters: any
}

const SummaryOfProjectsRow = (props: SummaryOfProjectsRow) => {
  const { rowFilters } = props
  const [requestParams, setRequestParams] = useState(initialRequestParams)

  const approvalSummaryApi = useApi<ApiApprovalSummary>({
    path: 'api/summary-of-projects',
    options: {
      triggerIf: false,
      params: requestParams,
      withStoreCache: false,
    },
  })

  return (
    <div className="table-row">
      <TableCell>
        <textarea></textarea>
      </TableCell>
      <TableCell>
        <div>Cluster</div>
        <div>Tranche</div>
        <div>Country</div>
        <div>Type</div>
        <div>Sector</div>
        <div>Agency</div>
      </TableCell>
      <TableCell>0</TableCell>
      <TableCell>0</TableCell>
      <TableCell>{formatDecimalValue(0)}</TableCell>
      <TableCell>{formatDecimalValue(0)}</TableCell>
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

  const rowFiltersApi = useApi({
    options: {},
    path: 'api/summary-of-projects/filters',
  })

  const rowFilters = useMemo(() => {
    if (rowFiltersApi.loaded && rowFiltersApi.data) {
      return rowFiltersApi.data
    }
    return []
  }, [rowFiltersApi.loaded, rowFiltersApi.data])

  return (
    <>
      <Box className="shadow-none">
        <div className="table w-full border-collapse">
          <div className="table-header-group font-bold">
            <div className="table-row">
              <TableCell>Projects and activities</TableCell>
              <TableCell>Context by row</TableCell>
              <TableCell>No. of countries</TableCell>
              <TableCell>No. of funding requests</TableCell>
              <TableCell>Amounts recommended (US $)</TableCell>
              <TableCell>Amounts in principle (US $)</TableCell>
            </div>
          </div>
          {rows.map((r, i) => (
            <SummaryOfProjectsRow key={i} rowFilters={rowFilters} />
          ))}
        </div>
        <div className="mt-4 flex gap-x-2">
          <Button size="large" variant="contained" onClick={addRow}>
            Add row
          </Button>
          <Button size="large" variant="contained" onClick={removeRow}>
            Remove row
          </Button>
        </div>
      </Box>
    </>
  )
}

const SummaryOfProjectsWrapper = () => {
  return (
    <Suspense>
      <SummaryOfProjects />
    </Suspense>
  )
}

export default SummaryOfProjectsWrapper
