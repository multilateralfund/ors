import { useState, useMemo, useRef } from 'react'

import ViewTable from '@ors/components/manage/Form/ViewTable'
import {
  getPaginationPageSize,
  getPaginationSelectorOpts,
} from '@ors/components/manage/Blocks/ProjectsListing/utils'
import getColumnDefs from './schema'
import { PCRTableProps } from '../interfaces'

import { sumBy } from 'lodash'

const PCRTable = ({ pcrProjects }: PCRTableProps) => {
  const gridRef = useRef(null)

  const { results = [], loading, loaded, count, setParams } = pcrProjects

  const [projectId, setProjectId] = useState<number | null>(null)
  const { defaultColDef, columnDefs } = getColumnDefs(projectId, setProjectId)

  const paginationPageSize = getPaginationPageSize(count, 50)
  const paginationPageSizeSelectorOpts = getPaginationSelectorOpts(count, 200)

  const pcrProjectsData = useMemo(
    () =>
      results.map((metaproject) => ({
        ...metaproject,
        isMetaproject: true,
        isExpanded: false,
        title: metaproject.umbrella_code ?? 'N/A',
        total_fund: sumBy(metaproject.projects, 'total_fund') || undefined,
        support_cost_psc:
          sumBy(metaproject.projects, 'support_cost_psc') || undefined,
      })),
    [results],
  )

  return (
    <ViewTable
      ref={gridRef}
      className="projects-table pcr-listing"
      getRowId={(params) =>
        `${params.data.isMetaproject ? 'metaproject' : 'project'}-${params.data.id}`
      }
      domLayout="normal"
      suppressScrollOnNewData={true}
      enablePagination={true}
      paginationPageSizeSelector={paginationPageSizeSelectorOpts}
      resizeGridOnRowUpdate={true}
      rowData={pcrProjectsData}
      rowCount={count}
      rowBuffer={100}
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
          .filter((column) => !!column.sort)
          .map(({ sort, colId }) => {
            const field = [
              'code',
              'tranche',
              'title',
              'total_fund',
              'metacode',
            ].includes(colId)
              ? colId
              : colId === 'cluster.code'
                ? colId.split('.')[0] + '__code'
                : colId.split('.')[0] + '__name'

            if (colId === 'code') {
              return (sort === 'asc' ? '' : '-') + 'filtered_code'
            }
            return (sort === 'asc' ? '' : '-') + field
          })
          .join(',')
        setParams({ offset: 0, ordering: ordering + ',-date_created' })
      }}
      {...{ defaultColDef, columnDefs, loaded, loading, paginationPageSize }}
    />
  )
}

export default PCRTable
