'use client'

import { useRef } from 'react'

import ViewTable from '@ors/components/manage/Form/ViewTable'
import getColumnDefs from '../../Enterprises/listing/schema'
import { useGetProjectEnterprises } from '../../hooks/useGetProjectEnterprises'
import { getPaginationSelectorOpts } from '../../utils'
import { PROJECTS_PER_PAGE } from '../../constants'

const PEnterprisesTable = ({
  enterprises,
}: {
  enterprises: ReturnType<typeof useGetProjectEnterprises>
}) => {
  const gridApiRef = useRef<any>()

  const { count, loaded, loading, results, setParams } = enterprises

  const { columnDefs, defaultColDef } = getColumnDefs('project-enterprise')
  const paginationPageSizeSelectorOpts = getPaginationSelectorOpts(count)

  return (
    loaded && (
      <ViewTable
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
            .map(
              ({ sort, colId }) =>
                (sort === 'asc' ? '' : '-') +
                (colId === 'status'
                  ? colId
                  : 'enterprise__' + colId.split('.')[1]),
            )
            .join(',')
          setParams({ offset: 0, ordering })
        }}
      />
    )
  )
}

export default PEnterprisesTable
