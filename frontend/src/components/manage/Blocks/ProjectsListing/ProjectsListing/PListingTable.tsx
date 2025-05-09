'use client'

import ViewTable from '@ors/components/manage/Form/ViewTable'

import getColumnDefs from './schema'
import { PROJECTS_PER_PAGE } from '../constants'

const PListingTable = ({ projects, filters }: any) => {
  const { count, loaded, loading, results, setParams } = projects
  const { columnDefs, defaultColDef } = getColumnDefs()

  const getPaginationSelectorOpts = (): number[] => {
    const nrResultsOpts = [100, 250, 500, 1000]
    const filteredNrResultsOptions = nrResultsOpts.filter(
      (option) => option < count,
    )
    return [...filteredNrResultsOptions, count]
  }

  const paginationPageSizeSelectorOpts = getPaginationSelectorOpts()

  return (
    loaded && (
      <ViewTable
        key={JSON.stringify(filters)}
        className="projects-table"
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        domLayout="normal"
        enablePagination={true}
        loaded={loaded}
        loading={loading}
        paginationPageSize={PROJECTS_PER_PAGE}
        paginationPageSizeSelector={paginationPageSizeSelectorOpts}
        rowBuffer={50}
        rowCount={count}
        rowData={results}
        rowsVisible={25}
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
            .map(
              ({ sort, colId }) =>
                (sort === 'asc' ? '' : '-') +
                (colId === 'title' ? colId : colId.split('.')[0] + '__name'),
            )
            .join(',')
          setParams({ offset: 0, ordering })
        }}
      />
    )
  )
}

export default PListingTable
