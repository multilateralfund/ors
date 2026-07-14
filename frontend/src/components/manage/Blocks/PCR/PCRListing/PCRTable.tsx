import { useMemo, useRef } from 'react'

import ViewTable from '@ors/components/manage/Form/ViewTable'
import {
  getPaginationPageSize,
  getPaginationSelectorOpts,
} from '@ors/components/manage/Blocks/ProjectsListing/utils'
import getColumnDefs from './schema'
import { PCRTableProps } from '../interfaces'

const PCRTable = ({
  pcrProjects,
  projectId,
  setProjectId,
  setPcrId,
  filters,
}: PCRTableProps) => {
  const gridRef = useRef(null)

  const { results = [], loading, loaded, count, setParams } = pcrProjects

  const paginationPageSize = getPaginationPageSize(count, 50)
  const paginationPageSizeSelectorOpts = getPaginationSelectorOpts(count, 200)

  const pcrProjectsData = useMemo(
    () =>
      results.map((metaproject) => {
        const projects = [...metaproject.projects]
        const pcrId =
          projects.find((project) => project.pcr_id)?.pcr_id ?? null

        return {
          ...metaproject,
          projects,
          isMetaproject: true,
          isExpanded: false,
          metaprojectId: metaproject.id,
          pcrId,
          ...(metaproject.type === 'Multi-year agreement'
            ? { title: metaproject.umbrella_code ?? 'N/A' }
            : { ...projects[0] }),
        }
      }),
    [results],
  )

  const { defaultColDef, columnDefs } = getColumnDefs(
    pcrProjectsData,
    projectId,
    setProjectId,
    setPcrId,
  )

  return (
    loaded && (
      <ViewTable
        gridRef={gridRef}
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
