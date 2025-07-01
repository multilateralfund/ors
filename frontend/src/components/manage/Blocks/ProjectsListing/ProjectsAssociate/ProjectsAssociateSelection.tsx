'use client'

import { useContext, useMemo, useRef } from 'react'

import ViewTable from '@ors/components/manage/Form/ViewTable'
import CustomLink from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import PListingFilters from '../ProjectsListing/PListingFilters'
import PListingTable from '../ProjectsListing/PListingTable'
import getColumnDefs from '../ProjectsListing/schema'
import { SubmitButton } from '../HelperComponents'
import { useGetProjectsAssociation } from '../hooks/useGetProjectsAssociation'
import { ProjectTypeApi } from '../interfaces'
import { initialFilters } from '../constants'

import { flatMap } from 'lodash'

const ProjectsAssociateSelection = ({
  project,
  projectsAssociation,
  associationIds,
  setAssociationIds,
  filters,
  setFilters,
  setMode,
}: {
  project: ProjectTypeApi
  projectsAssociation: ReturnType<typeof useGetProjectsAssociation>
  associationIds: number[]
  setAssociationIds: (ids: number[]) => void
  filters: any
  setFilters: (filters: any) => void
  setMode: (mode: string) => void
}) => {
  const form = useRef<any>()

  const { canAssociateProjects } = useContext(PermissionsContext)

  const { results = [], setParams } = projectsAssociation

  const formattedResults = results.map((result) => {
    const formattedProjects = (result.projects || []).map(
      (project, index, arr) => ({
        ...project,
        isFirst: index === 0,
        isLast: index === arr.length - 1,
        isOnly: arr.length === 1,
      }),
    )

    return {
      ...result,
      projects: formattedProjects,
    }
  })

  const projects = {
    ...projectsAssociation,
    results: flatMap(formattedResults, (entry) => entry.projects || []),
  }

  const key = useMemo(() => JSON.stringify(filters), [filters])

  const { columnDefs, defaultColDef } = getColumnDefs('association')

  const selectedProjectData = (
    <ViewTable
      className="projects-table project-association-table"
      columnDefs={columnDefs}
      defaultColDef={defaultColDef}
      alwaysShowHorizontalScroll={false}
      domLayout="autoHeight"
      rowHeight={50}
      headerHeight={0}
      rowData={[project]}
      rowCount={1}
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
        <div className="flex flex-wrap items-center gap-2.5">
          <CustomLink
            className="h-9 border border-solid border-primary bg-white px-4 py-2 text-primary shadow-none"
            color="primary"
            href="/projects-listing"
            size="large"
            variant="contained"
            button
          >
            Cancel
          </CustomLink>
          {canAssociateProjects && (
            <SubmitButton
              title="Associate"
              isDisabled={associationIds.length === 0}
              onSubmit={associateProject}
              className="h-9"
            />
          )}
        </div>
      </div>
      <p className="my-0 text-[22px]">Selected project</p>
      {selectedProjectData}
      <p className="my-0 text-[22px]">Associate with</p>
      <form className="flex flex-col gap-6" ref={form} key={key}>
        <div className="flex flex-wrap justify-between gap-x-10 gap-y-4">
          <PListingFilters
            mode="association"
            {...{ form, filters, initialFilters, setFilters, setParams }}
          />
        </div>
        <PListingTable
          mode="association"
          {...{ projects, filters, associationIds, setAssociationIds }}
        />
      </form>
    </>
  )
}

export default ProjectsAssociateSelection
