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
