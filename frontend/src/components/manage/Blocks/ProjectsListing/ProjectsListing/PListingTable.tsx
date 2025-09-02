'use client'

import type { useGetProjects } from '@ors/components/manage/Blocks/ProjectsListing/hooks/useGetProjects.ts'
import ViewTable from '@ors/components/manage/Form/ViewTable'
import type { useGetProjectsAssociation } from '../hooks/useGetProjectsAssociation'
import { getPaginationSelectorOpts } from '../utils'
import { ListingProjectData } from '../interfaces'
import { PROJECTS_PER_PAGE } from '../constants'
import getColumnDefs from './schema'

import cx from 'classnames'

export type PListingTableProps = {
  projects: ReturnType<typeof useGetProjects | typeof useGetProjectsAssociation>
  filters: Record<string, any>
  mode: string
  projectId?: number | null
  setProjectData?: (data: ListingProjectData) => void
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

  const paginationPageSizeSelectorOpts = getPaginationSelectorOpts(count)

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
            'is-current-project': (params) => params?.data?.is_current_project,
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
                  : colId === 'metaproject_new_code'
                    ? 'meta_project__code'
                    : colId.split('.')[0] + '__name'

              if (colId === 'code') {
                // Ordering by code needs to be sent as 'filtered_code'
                return (sort === 'asc' ? '' : '-') + 'filtered_code'
              }
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
