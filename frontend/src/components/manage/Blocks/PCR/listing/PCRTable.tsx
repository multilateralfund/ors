import { useRef } from 'react'

import ViewTable from '@ors/components/manage/Form/ViewTable'
import {
  getPaginationPageSize,
  getPaginationSelectorOpts,
} from '@ors/components/manage/Blocks/ProjectsListing/utils'
import getColumnDefs from './schema'
import { useGetPCRs } from '../hooks/useGetPCRs'

const PCRTable = ({
  pcrs,
  selectedProjectId,
  setSelectedProjectId,
}: {
  pcrs: ReturnType<typeof useGetPCRs>
  selectedProjectId: number | null
  setSelectedProjectId: (id: number | null) => void
}) => {
  const gridApiRef = useRef<any>()

  const { results, count, loaded, loading, setParams } = pcrs

  const { columnDefs, defaultColDef } = getColumnDefs(
    selectedProjectId,
    setSelectedProjectId,
  )
  const paginationSelectorOpts = getPaginationSelectorOpts(count, 500)

  return (
    <>
      {loaded && (
        <ViewTable
          domLayout="normal"
          getRowId={(props) => props.data.id}
          defaultColDef={defaultColDef}
          columnDefs={columnDefs}
          loading={loading}
          loaded={loaded}
          rowData={results}
          rowCount={count}
          rowsVisible={90}
          rowBuffer={100}
          tooltipShowDelay={200}
          resizeGridOnRowUpdate={true}
          suppressScrollOnNewData={true}
          enablePagination={true}
          paginationPageSize={getPaginationPageSize(count)}
          paginationPageSizeSelector={paginationSelectorOpts}
          onGridReady={({ api }) => {
            gridApiRef.current = api
          }}
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
              .map(({ sort, colId }) => (sort === 'asc' ? '' : '-') + colId)
              .join(',')
            setParams({ offset: 0, ordering })
          }}
        />
      )}
    </>
  )
}

export default PCRTable
