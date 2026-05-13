import { useRef, useState } from 'react'

import ViewTable from '@ors/components/manage/Form/ViewTable'
import DeleteEnterpriseModal from './DeleteEnterpriseModal'
import getColumnDefs from './schema'
import { useGetEnterprises } from '../../hooks/useGetEnterprises'
import { getPaginationPageSize, getPaginationSelectorOpts } from '../../utils'

const EnterprisesTable = ({
  enterprises,
}: {
  enterprises: ReturnType<typeof useGetEnterprises>
}) => {
  const gridApiRef = useRef<any>()

  const { results, count, loaded, loading, setParams } = enterprises

  const [idToDelete, setIdToDelete] = useState<number | null>(null)

  const { columnDefs, defaultColDef } = getColumnDefs(setIdToDelete)
  const paginationPageSizeSelectorOpts = getPaginationSelectorOpts(count, 500)

  return (
    <>
      {loaded && (
        <ViewTable
          getRowId={(props) => props.data.id}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          domLayout="normal"
          suppressScrollOnNewData={true}
          enablePagination={true}
          loaded={loaded}
          loading={loading}
          paginationPageSize={getPaginationPageSize(count)}
          paginationPageSizeSelector={paginationPageSizeSelectorOpts}
          resizeGridOnRowUpdate={true}
          rowBuffer={100}
          rowCount={count}
          rowData={results}
          rowsVisible={90}
          tooltipShowDelay={200}
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
      {idToDelete && (
        <DeleteEnterpriseModal
          mode="listing"
          {...{ idToDelete, setIdToDelete, setParams }}
        />
      )}
    </>
  )
}

export default EnterprisesTable
