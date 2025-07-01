'use client'

import type { useGetProjects } from '@ors/components/manage/Blocks/ProjectsListing/hooks/useGetProjects.ts'
import type { useGetProjectsAssociation } from '../hooks/useGetProjectsAssociation'
import ViewTable from '@ors/components/manage/Form/ViewTable'
import getColumnDefs from './schema'
import { PROJECTS_PER_PAGE } from '../constants'

import cx from 'classnames'

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
  enablePagination?: boolean
}

const PListingTable = ({
  projects,
  filters,
  mode,
  projectId,
  setProjectData,
  associationIds,
  setAssociationIds,
  enablePagination,
}: PListingTableProps) => {
  const { count, loaded, loading, results, setParams } = projects

  const { columnDefs, defaultColDef } = getColumnDefs(
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
        className={cx('projects-table', {
          'projects-association-table': mode !== 'listing',
          'projects-association-listing': mode === 'association-listing',
          'projects-association': mode === 'association',
        })}
        {...(mode !== 'listing' && {
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
        enablePagination={enablePagination ?? true}
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
