'use client'

import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import ExpandableMenu from '../ProjectsListing/ExpandableMenu'
import ProjectsAssociate from './ProjectsAssociate'
import { useGetProject } from '../hooks/useGetProject'
import { menus } from '../constants'
import { useStore } from '@ors/store'

import { useParams } from 'wouter'

const ProjectsAssociateWrapper = () => {
  const { project_id } = useParams<Record<string, string>>()

  const project = useGetProject(project_id)
  const { data, loading } = project

  const commonSlice = useStore((state) => state.common)
  const user_permissions = commonSlice.user_permissions.data || []

  return (
    <>
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
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && data && <ProjectsAssociate project={data} />}
    </>
  )
}

export default ProjectsAssociateWrapper
