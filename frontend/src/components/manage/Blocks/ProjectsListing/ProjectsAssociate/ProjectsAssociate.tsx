'use client'

import { useMemo, useRef, useState } from 'react'

import ViewTable from '@ors/components/manage/Form/ViewTable'
import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import ExpandableMenu from '../ProjectsListing/ExpandableMenu'
import PListingFilters from '../ProjectsListing/PListingFilters'
import PListingTable from '../ProjectsListing/PListingTable'
import getColumnDefs from '../ProjectsListing/schema'
import { SubmitButton } from '../HelperComponents'
import { useGetProjectsAssociation } from '../hooks/useGetProjectsAssociation'
import { menus, PROJECTS_PER_PAGE } from '../constants'
import { ProjectTypeApi } from '../interfaces'
import { useStore } from '@ors/store'

import { Box } from '@mui/material'

const ProjectsAssociate = ({ project }: { project: ProjectTypeApi }) => {
  const form = useRef<any>()

  const commonSlice = useStore((state) => state.common)
  const user_permissions = commonSlice.user_permissions.data || []

  const initialFilters = {
    offset: 0,
    limit: PROJECTS_PER_PAGE,
    ordering: '-date_created',
  }

  const projects = useGetProjectsAssociation(initialFilters)
  const { loading, setParams } = projects

  const [filters, setFilters] = useState({ ...initialFilters })
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const { columnDefs, defaultColDef } = getColumnDefs([], 'associate')

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

  const associateProject = () => {}

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <div className="mt-5 flex flex-wrap justify-between gap-y-3">
        <div className="flex flex-wrap gap-x-2 gap-y-3">
          {menus.map((menu) => (
            <ExpandableMenu menu={menu} />
          ))}
        </div>
        {user_permissions.includes('add_project') && (
          <CustomLink
            className="mb-4 h-10 min-w-[6.25rem] text-nowrap px-4 py-2 text-lg uppercase"
            href="/projects-listing/create"
            color="secondary"
            variant="contained"
            button
          >
            New Project Submission
          </CustomLink>
        )}
      </div>
      <Box className="my-2 flex flex-col gap-6 shadow-none">
        <div className="flex flex-wrap items-center justify-between">
          <PageHeading className="mt-2 min-w-fit">
            Associate projects
          </PageHeading>
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
            <SubmitButton
              title="Associate"
              isDisabled={false}
              onSubmit={associateProject}
              className="h-9"
            />
          </div>
        </div>
        <p className="my-0 text-[22px]">Selected project</p>
        {selectedProjectData}
        <p className="my-0 text-[22px]">Associate with</p>
        <form className="flex flex-col gap-6" ref={form} key={key}>
          <div className="flex flex-wrap justify-between gap-x-10 gap-y-4">
            <PListingFilters
              {...{ form, filters, initialFilters, setFilters, setParams }}
            />
          </div>
          <PListingTable mode="association" {...{ projects, filters }} />
        </form>
      </Box>
    </>
  )
}

export default ProjectsAssociate
