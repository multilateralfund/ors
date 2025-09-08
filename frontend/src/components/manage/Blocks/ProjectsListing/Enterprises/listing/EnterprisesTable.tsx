'use client'

import { useRef } from 'react'

import ViewTable from '@ors/components/manage/Form/ViewTable'
import { useGetEnterprises } from '../../hooks/useGetEnterprises'
import { getPaginationSelectorOpts } from '../../utils'
import { PROJECTS_PER_PAGE } from '../../constants'
import getColumnDefs from './schema'

const EnterprisesTable = ({
  enterprises,
  filters,
}: {
  enterprises: ReturnType<typeof useGetEnterprises>
  filters: Record<string, any>
}) => {
  const gridApiRef = useRef<any>()

  const { data, loaded, loading, setParams } = enterprises
  const { results = [] } = data ?? {}
  const count = results.length

  const { columnDefs, defaultColDef } = getColumnDefs(results)
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

export default EnterprisesTable
