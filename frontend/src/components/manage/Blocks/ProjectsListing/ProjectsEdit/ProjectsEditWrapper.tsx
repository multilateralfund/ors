import { useContext } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ProjectsEdit from './ProjectsEdit'
import { useGetProject } from '../hooks/useGetProject'

import { Redirect, useParams } from 'wouter'
import { isNull } from 'lodash'

const ProjectsEditWrapper = ({ mode }: { mode: string }) => {
  const { project_id } = useParams<Record<string, string>>()

  const { canUpdateProjects } = useContext(PermissionsContext)

  const project = useGetProject(project_id)
  const { data, loading } = project

  if (project?.error) {
    return <Redirect to="/projects-listing/listing" />
  }

  if (
    data &&
    ((mode !== 'copy' &&
      ((['Withdrawn', 'Not approved', 'Approved'].includes(
        data.submission_status,
      ) &&
        mode !== 'edit') ||
        (mode !== 'edit' &&
          data.version >= 3 &&
          data.submission_status !== 'Recommended'))) ||
      !isNull(data.latest_project) ||
      (mode !== 'copy' && !data.editable) ||
      (mode !== 'edit' && !canUpdateProjects))
  ) {
    return <Redirect to={`/projects-listing/${project_id}`} />
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && data && <ProjectsEdit project={data} mode={mode} />}
    </>
  )
}

export default ProjectsEditWrapper
