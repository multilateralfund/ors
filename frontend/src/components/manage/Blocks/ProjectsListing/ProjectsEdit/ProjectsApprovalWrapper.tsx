import Loading from '@ors/components/theme/Loading/Loading'
import ProjectsEdit from './ProjectsEdit'
import { useGetProject } from '../hooks/useGetProject'

import { Redirect, useParams } from 'wouter'
import { isNull } from 'lodash'

const ProjectsApprovalWrapper = () => {
  const { project_id } = useParams<Record<string, string>>()

  const project = useGetProject(project_id)
  const { data, loading } = project

  if (
    project?.error ||
    (data &&
      (!isNull(data.latest_project) ||
        data.submission_status !== 'Recommended'))
  ) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && data && (
        <ProjectsEdit project={data} mode="edit" approval={true} />
      )}
    </>
  )
}

export default ProjectsApprovalWrapper
