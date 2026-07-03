'use client'

import type { useGetPCRProjects } from './hooks/useGetPCRProjects'
import ViewTable from '@ors/components/manage/Form/ViewTable'
import { getPaginationPageSize, getPaginationSelectorOpts } from '../utils'
import { PCR_PROJECTS_PER_PAGE } from './constants'
import getColumnDefs from './schema'

import cx from 'classnames'

type PCRTableProps = {
  projects: ReturnType<typeof useGetPCRProjects>
  filters: Record<string, any>
}

const orderingFields: Record<string, string> = {
  project_metacode: 'project__metacode',
  country: 'project__country__name',
  lead_agency: 'project__lead_agency__name',
  cluster: 'project__cluster__name',
  type: 'project__project_type__name',
  sector: 'project__sector__name',
  title: 'project__title',
  pcr_submission_date: 'date_created',
}

const PCRTable = ({ projects, filters }: PCRTableProps) => {
  const { count, loaded, loading, results, setParams } = projects
  const { columnDefs, defaultColDef } = getColumnDefs()

  const paginationPageSizeSelectorOpts = getPaginationSelectorOpts(count, 200)
  const paginationPageSize = getPaginationPageSize(
    count,
    PCR_PROJECTS_PER_PAGE,
  )

  return (
    loaded && (
      <ViewTable
        key={JSON.stringify(filters)}
        className={cx('projects-table')}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        domLayout="normal"
        suppressScrollOnNewData={true}
        enablePagination={true}
        loaded={loaded}
        loading={loading}
        paginationPageSize={paginationPageSize}
        paginationPageSizeSelector={paginationPageSizeSelectorOpts}
        resizeGridOnRowUpdate={true}
        rowBuffer={100}
        rowCount={count}
        rowData={results}
        rowsVisible={90}
        tooltipShowDelay={200}
        components={{
          agColumnHeader: undefined,
          agTextCellRenderer: undefined,
        }}
        onPaginationChanged={({ page, rowsPerPage }) => {
          setParams({
            limit: rowsPerPage,
            offset: page * rowsPerPage,
          })
        }}
        onSortChanged={({ api }) => {
          const ordering = api
            .getColumnState()
            .filter((column) => !!column.sort && orderingFields[column.colId])
            .map(({ sort, colId }) => {
              const field = orderingFields[colId]
              return (sort === 'asc' ? '' : '-') + field
            })
            .join(',')

          setParams({ offset: 0, ordering: ordering || '-date_created' })
        }}
      />
    )
  )
}

export default PCRTable
