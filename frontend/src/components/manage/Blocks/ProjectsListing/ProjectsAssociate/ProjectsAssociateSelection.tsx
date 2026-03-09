'use client'

import { useMemo, useRef, useState } from 'react'

import CustomAlert from '@ors/components/theme/Alerts/CustomAlert'
import ViewTable from '@ors/components/manage/Form/ViewTable'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PListingFilters from '../ProjectsListing/PListingFilters'
import PListingTable from '../ProjectsListing/PListingTable'
import getColumnDefs from '../ProjectsListing/schema'
import { SubmitButton } from '../HelperComponents'
import { useGetProjects } from '../hooks/useGetProjects'
import { getPaginationPageSize, getPaginationSelectorOpts } from '../utils'
import { ProjectTypeApi } from '../interfaces'

import { Typography } from '@mui/material'

const ProjectsAssociateSelection = ({
  crtProjects = [],
  projectsForAssociation,
  associationIds,
  setAssociationIds,
  filters,
  setFilters,
  projectFilters,
  setMode,
}: {
  crtProjects: ProjectTypeApi[]
  projectsForAssociation: ReturnType<typeof useGetProjects>
  associationIds: number[]
  setAssociationIds: (ids: number[]) => void
  filters: any
  setFilters: (filters: any) => void
  projectFilters: any
  setMode: (mode: string) => void
}) => {
  const form = useRef<any>()
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const { setParams } = projectsForAssociation

  const { columnDefs, defaultColDef } = getColumnDefs('association')

  const NR_PROJECTS = 50

  const [offset, setOffset] = useState(0)
  const [nrResults, setNrResults] = useState(NR_PROJECTS)

  const count = crtProjects.length
  const paginationPageSizeSelectorOpts = getPaginationSelectorOpts(count, 200)
  const paginationPageSize = getPaginationPageSize(count, NR_PROJECTS)

  const projects = useMemo(
    () => crtProjects.slice(offset, offset + nrResults),
    [crtProjects, offset, nrResults],
  )

  const selectedProjectData = (
    <ViewTable
      key={JSON.stringify(crtProjects)}
      className="projects-table project-association-table"
      columnDefs={columnDefs}
      defaultColDef={defaultColDef}
      suppressScrollOnNewData={true}
      resizeGridOnRowUpdate={true}
      domLayout="autoHeight"
      headerHeight={0}
      rowData={projects}
      rowCount={count}
      rowsVisible={Math.min(count, 90)}
      rowBuffer={count}
      rowClassRules={{
        'is-current-project': (params) => params?.data?.is_current_project,
      }}
      enablePagination={true}
      paginationPageSize={paginationPageSize}
      paginationPageSizeSelector={paginationPageSizeSelectorOpts}
      onPaginationChanged={({ page, rowsPerPage }) => {
        setNrResults((prevRowsPerPage) => {
          if (prevRowsPerPage !== rowsPerPage) {
            const updatedPage = Math.floor(offset / rowsPerPage)
            setOffset(updatedPage * rowsPerPage)

            return rowsPerPage
          }

          setOffset(page * rowsPerPage)
          return rowsPerPage
        })
      }}
      components={{
        agColumnHeader: undefined,
        agTextCellRenderer: undefined,
      }}
    />
  )

  const associateProject = () => {
    setMode('confirmation')
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-1">
        <PageHeading className="min-w-fit">Associate projects</PageHeading>
        <SubmitButton
          title="Associate"
          isDisabled={associationIds.length === 0}
          onSubmit={associateProject}
          className="h-9"
        />
      </div>
      <p className="my-0 text-[22px]">Selected project(s)</p>
      <div>
        {selectedProjectData}
        {crtProjects.length > 1 && (
          <CustomAlert
            type="info"
            alertClassName="mt-4 px-2 py-0"
            content={
              <Typography className="text-lg leading-5">
                Already associated projects or components will be associated as
                well.
              </Typography>
            }
          />
        )}
      </div>
      <p className="my-0 text-[22px]">Associate with</p>
      <form className="flex flex-col gap-6" ref={form} key={key}>
        <div className="flex flex-wrap justify-between gap-x-10 gap-y-4">
          <PListingFilters
            mode="association"
            {...{
              form,
              filters,
              setFilters,
              setParams,
              projectFilters,
            }}
          />
        </div>
        <PListingTable
          mode="association"
          projects={projectsForAssociation}
          sortable={true}
          {...{ filters, associationIds, setAssociationIds }}
        />
      </form>
    </>
  )
}

export default ProjectsAssociateSelection
