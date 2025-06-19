'use client'

import type { useGetProjects } from '@ors/components/manage/Blocks/ProjectsListing/hooks/useGetProjects.ts'
import type { useGetProjectsAssociation } from '../hooks/useGetProjectsAssociation'
import ViewTable from '@ors/components/manage/Form/ViewTable'
import getColumnDefs from './schema'
import { PROJECTS_PER_PAGE } from '../constants'
import { useStore } from '@ors/store'
import { ProjectAssociationType, ProjectType } from '@ors/types/api_projects'

export type PListingTableProps = {
  projects: ReturnType<typeof useGetProjects | typeof useGetProjectsAssociation>
  filters: Record<string, any>
  mode: string
  projectId?: number | null
  setProjectData?: (data: {
    projectId: number | null
    projectTitle: string
  }) => void
  associationIds?: number[]
  setAssociationIds?: (data: number[]) => void
}

const PListingTable = ({
  projects,
  filters,
  mode,
  projectId,
  setProjectData,
  associationIds,
  setAssociationIds,
}: PListingTableProps) => {
  const { count, loaded, loading, results, setParams } = projects

  const commonSlice = useStore((state) => state.common)
  const user_permissions = commonSlice.user_permissions.data || []

  const rowData =
    mode === 'listing'
      ? (results as ProjectType[])
      : (results as ProjectAssociationType[]).flatMap(
          (entry) => entry.projects || [],
        )

  const { columnDefs, defaultColDef } = getColumnDefs(
    user_permissions,
    mode,
    projectId,
    setProjectData,
    associationIds,
    setAssociationIds,
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
        className={`projects-table ${mode === 'association' ? 'projects-association-listing' : ''}`}
        {...(mode === 'association' && {
          rowClassRules: {
            'prev-is-multiple': (params) => {
              const prev = params.api.getDisplayedRowAtIndex(
                params.rowIndex - 1,
              )
              return !prev?.data?.isOnly
            },
          },
        })}
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
        rowBuffer={50}
        rowCount={count}
        rowData={rowData}
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
