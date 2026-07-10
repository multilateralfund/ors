import { useMemo, useRef } from 'react'

import ViewTable from '@ors/components/manage/Form/ViewTable'
import {
  getPaginationPageSize,
  getPaginationSelectorOpts,
} from '@ors/components/manage/Blocks/ProjectsListing/utils'
import getColumnDefs from './schema'
import { PCRTableProps } from '../interfaces'

import { sumBy } from 'lodash'

const PCRTable = ({
  pcrProjects,
  projectId,
  setProjectId,
  filters,
}: PCRTableProps) => {
  const gridRef = useRef(null)

  const { results = [], loading, loaded, count, setParams } = pcrProjects

  const { defaultColDef, columnDefs } = getColumnDefs(projectId, setProjectId)

  const paginationPageSize = getPaginationPageSize(count, 50)
  const paginationPageSizeSelectorOpts = getPaginationSelectorOpts(count, 200)

  // to update
  const pcrProjectsData = useMemo(
    () =>
      results.map((metaproject) => ({
        ...(metaproject.type !== 'multi-year'
          ? {
              ...metaproject,
              isMetaproject: true,
              isExpanded: false,
              metaprojectId: metaproject.id,
              title: metaproject.umbrella_code ?? 'N/A',
              total_fund:
                sumBy(metaproject.projects, 'total_fund') || undefined,
              support_cost_psc:
                sumBy(metaproject.projects, 'support_cost_psc') || undefined,
            }
          : {
              ...metaproject.projects[0],
              isMetaproject: true,
              metaprojectId: metaproject.id,
            }),
      })),
    [results],
  )

  return (
    loaded && (
      <ViewTable
        ref={gridRef}
        key={JSON.stringify(filters)}
        getRowId={(params) =>
          `${params.data.isMetaproject ? 'metaproject' : 'project'}-${params.data.id}`
        }
        rowClassRules={{
          'pcr-metaproject': (params) => params.data.isMetaproject,
          'pcr-expanded-metaproject': (params) => params.data.isExpanded,
        }}
        domLayout="normal"
        className="projects-table pcr-listing"
        rowData={pcrProjectsData}
        rowCount={count}
        rowBuffer={100}
        rowsVisible={90}
        tooltipShowDelay={200}
        components={{
          agColumnHeader: undefined,
          agTextCellRenderer: undefined,
        }}
        suppressScrollOnNewData={true}
        resizeGridOnRowUpdate={true}
        enablePagination={true}
        paginationPageSizeSelector={paginationPageSizeSelectorOpts}
        onPaginationChanged={({ page, rowsPerPage }) => {
          setParams({
            limit: rowsPerPage,
            offset: page * rowsPerPage,
          })
        }}
        {...{ defaultColDef, columnDefs, loaded, loading, paginationPageSize }}
      />
    )
  )
}

export default PCRTable
