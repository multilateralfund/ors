'use client'

import { useRef } from 'react'

import ViewTable from '@ors/components/manage/Form/ViewTable'
import { useGetProjectEnterprises } from '../../hooks/useGetProjectEnterprises'
import { getPaginationSelectorOpts } from '../../utils'
import { PROJECTS_PER_PAGE } from '../../constants'
import getColumnDefs from './schema'

const PEnterprisesTable = ({
  enterprises,
  filters,
  enterpriseId,
  setEnterpriseId,
}: {
  enterprises: ReturnType<typeof useGetProjectEnterprises>
  filters: Record<string, any>
  enterpriseId?: number | null
  setEnterpriseId?: (enterpriseId: number | null) => void
}) => {
  const gridApiRef = useRef<any>()

  const { count, loaded, loading, results, setParams } = enterprises

  const { columnDefs, defaultColDef } = getColumnDefs(
    gridApiRef,
    enterpriseId,
    setEnterpriseId,
  )
  const paginationPageSizeSelectorOpts = getPaginationSelectorOpts(count)

  return (
    loaded && (
      <ViewTable
        key={JSON.stringify(filters)}
        getRowId={(props) => props.data.id}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        domLayout="normal"
        suppressScrollOnNewData={true}
        enablePagination={true}
        loaded={loaded}
        loading={loading}
        paginationPageSize={PROJECTS_PER_PAGE}
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
    )
  )
}

export default PEnterprisesTable
