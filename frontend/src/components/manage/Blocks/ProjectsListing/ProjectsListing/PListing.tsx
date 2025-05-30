'use client'

import { useMemo, useRef, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import PListingFilters from './PListingFilters'
import PListingTable from './PListingTable'
import { useGetProjects } from '../hooks/useGetProjects'
import { PROJECTS_PER_PAGE } from '../constants'
import { useStore } from '@ors/store'

export default function PListing() {
  const form = useRef<any>()

  const projectSlice = useStore((state) => state.projects)
  const user_permissions = projectSlice.user_permissions.data || []

  const initialFilters = {
    offset: 0,
    limit: PROJECTS_PER_PAGE,
  }

  const projects = useGetProjects(initialFilters)
  const { loading, setParams } = projects

  const [projectId, setProjectId] = useState<number | null>(null)
  const [filters, setFilters] = useState({ ...initialFilters })
  const key = useMemo(() => JSON.stringify(filters), [filters])

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {user_permissions.includes('add_project') && (
        <div className="ml-auto flex flex-wrap gap-3">
          <CustomLink
            className="mb-4 h-10 min-w-[6.25rem] text-nowrap px-4 py-2 text-lg uppercase"
            href="/projects-listing/create"
            color="secondary"
            variant="contained"
            button
          >
            New Project Submission
          </CustomLink>
          <CustomLink
            className="mb-4 h-10 min-w-[6.25rem] text-nowrap px-4 py-2 text-lg uppercase"
            href={`/projects-listing/create/${projectId}/copy`}
            color="secondary"
            variant="contained"
            disabled={!projectId}
            button
          >
            Copy project
          </CustomLink>
        </div>
      )}
      <form className="flex flex-col gap-6" ref={form} key={key}>
        <PListingFilters
          {...{ form, filters, initialFilters, setFilters, setParams }}
        />
        <PListingTable {...{ projects, filters, projectId, setProjectId }} />
      </form>
    </>
  )
}
