import { useRef } from 'react'

import ViewTable from '@ors/components/manage/Form/ViewTable'
import {
  getPaginationPageSize,
  getPaginationSelectorOpts,
} from '@ors/components/manage/Blocks/ProjectsListing/utils'
import getColumnDefsPcrDue from './schemaPcrDue'
import getColumnDefs from './schema'
import { ManagePCRsTableProps } from '../interfaces'

const ManagePCRsTable = ({
  type,
  pcrProjects,
  projectIds,
  setProjectIds,
  unmarkProjects,
  filters,
}: ManagePCRsTableProps) => {
  const gridRef = useRef(null)

  const { results = [], loading, loaded, count, setParams } = pcrProjects

  const paginationPageSize = getPaginationPageSize(count, 50)
  const paginationPageSizeSelectorOpts = getPaginationSelectorOpts(count, 200)

  const { defaultColDef, columnDefs } =
    type === 'due'
      ? getColumnDefsPcrDue(unmarkProjects!)
      : getColumnDefs(projectIds!, setProjectIds!)

  return (
    loaded && (
      <ViewTable
        gridRef={gridRef}
        key={JSON.stringify(filters)}
        getRowId={(params) => params.data.id}
        domLayout="normal"
        className="projects-table pcr-listing"
        rowData={results}
        rowCount={count}
        rowBuffer={100}
        rowsVisible={90}
        tooltipShowDelay={200}
        components={{
          agColumnHeader: undefined,
          agTextCellRenderer: undefined,
        }}
        suppressScrollOnNewData={true}
        resizeGridOnRowUpdate={true}
        enablePagination={true}
        paginationPageSizeSelector={paginationPageSizeSelectorOpts}
        onPaginationChanged={({ page, rowsPerPage }) => {
          setParams({
            limit: rowsPerPage,
            offset: page * rowsPerPage,
          })
        }}
        {...{ defaultColDef, columnDefs, loaded, loading, paginationPageSize }}
      />
    )
  )
}

export default ManagePCRsTable
