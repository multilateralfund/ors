'use client'

import { useMemo, useRef } from 'react'

import CustomAlert from '@ors/components/theme/Alerts/CustomAlert'
import ViewTable from '@ors/components/manage/Form/ViewTable'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PListingFilters from '../ProjectsListing/PListingFilters'
import PListingTable from '../ProjectsListing/PListingTable'
import getColumnDefs from '../ProjectsListing/schema'
import { SubmitButton } from '../HelperComponents'
import { useGetProjects } from '../hooks/useGetProjects'
import { ProjectTypeApi } from '../interfaces'
import { initialFilters } from '../constants'

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

  const selectedProjectData = (
    <ViewTable
      key={JSON.stringify(crtProjects)}
      className="projects-table project-association-table"
      columnDefs={columnDefs}
      defaultColDef={defaultColDef}
      suppressScrollOnNewData={true}
      resizeGridOnRowUpdate={true}
      domLayout="normal"
      headerHeight={0}
      rowData={crtProjects}
      rowCount={crtProjects.length}
      rowsVisible={Math.min(crtProjects.length, 90)}
      rowBuffer={crtProjects.length}
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
      <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
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
            alertClassName=" mt-4 px-2 py-0"
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
              initialFilters,
              setFilters,
              setParams,
              projectFilters,
            }}
          />
        </div>
        <PListingTable
          mode="association"
          projects={projectsForAssociation}
          {...{ filters, associationIds, setAssociationIds }}
        />
      </form>
    </>
  )
}

export default ProjectsAssociateSelection
