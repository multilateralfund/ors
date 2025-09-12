'use client'

import ViewTable from '@ors/components/manage/Form/ViewTable'
import { useGetEnterprises } from '../../hooks/useGetEnterprises'
import { getPaginationSelectorOpts } from '../../utils'
import { PROJECTS_PER_PAGE } from '../../constants'
import getColumnDefs from './schema'

const EnterprisesTable = ({
  enterprises,
}: {
  enterprises: ReturnType<typeof useGetEnterprises>
}) => {
  const { results, count, loaded, loading, setParams } = enterprises

  const { columnDefs, defaultColDef } = getColumnDefs('enterprise')
  const paginationPageSizeSelectorOpts = getPaginationSelectorOpts(count)

  return (
    loaded && (
      <ViewTable
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
