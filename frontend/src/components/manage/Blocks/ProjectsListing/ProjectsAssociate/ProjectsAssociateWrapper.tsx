'use client'

import { useContext } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ExpandableMenu from '../ProjectsListing/ExpandableMenu'
import ProjectsAssociate from './ProjectsAssociate'
import { CreateButton } from '../HelperComponents'
import { useGetProject } from '../hooks/useGetProject'
import { getMenus } from '../utils'

import { Redirect, useParams } from 'wouter'
import { isNull } from 'lodash'

const ProjectsAssociateWrapper = () => {
  const { project_id } = useParams<Record<string, string>>()

  const {
    canViewBp,
    canUpdateBp,
    canUpdateProjects,
    canViewProjects,
    canViewEnterprises,
  } = useContext(PermissionsContext)

  const project = useGetProject(project_id)
  const { data, loading } = project

  if (project?.error || (data && !isNull(data.latest_project))) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <>
      <div className="mt-5 flex flex-wrap justify-between gap-y-3">
        <div className="mb-2 flex flex-wrap gap-x-2 gap-y-3">
          {getMenus({
            canViewBp,
            canUpdateBp,
            canViewProjects,
            canViewEnterprises,
          }).map((menu) => (
            <ExpandableMenu menu={menu} />
          ))}
        </div>
        {canUpdateProjects && (
          <CreateButton
            title="New Project Submission"
            href="/projects-listing/create"
          />
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
