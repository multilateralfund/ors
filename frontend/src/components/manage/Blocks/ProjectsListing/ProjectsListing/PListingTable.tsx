'use client'

import type { useGetProjects } from '@ors/components/manage/Blocks/ProjectsListing/hooks/useGetProjects.ts'
import ViewTable from '@ors/components/manage/Form/ViewTable'
import getColumnDefs from './schema'
import { PROJECTS_PER_PAGE } from '../constants'
import { useStore } from '@ors/store'

export type PListingTableProps = {
  projects: ReturnType<typeof useGetProjects>
  filters: Record<string, any>
  projectId: number | null
  setProjectData: (data: {
    projectId: number | null
    projectTitle: string
  }) => void
}

const PListingTable = ({
  projects,
  filters,
  projectId,
  setProjectData,
}: PListingTableProps) => {
  const { count, loaded, loading, results, setParams } = projects

  const commonSlice = useStore((state) => state.common)
  const user_permissions = commonSlice.user_permissions.data || []

  const { columnDefs, defaultColDef } = getColumnDefs(
    user_permissions,
    projectId,
    setProjectData,
  )

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
        resizeGridOnRowUpdate={true}
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
            .map(({ sort, colId }) => {
              const field = ['code', 'tranche', 'title', 'total_fund'].includes(
                colId,
              )
                ? colId
                : colId === 'cluster.code'
                  ? colId.split('.')[0] + '__code'
                  : colId === 'metaproject_code'
                    ? 'meta_project__code'
                    : colId.split('.')[0] + '__name'

              return (sort === 'asc' ? '' : '-') + field
            })
            .join(',')
          setParams({ offset: 0, ordering })
        }}
      />
    )
  )
}

export default PListingTable
