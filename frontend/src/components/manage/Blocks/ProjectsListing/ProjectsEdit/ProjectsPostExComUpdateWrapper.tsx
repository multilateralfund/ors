import Loading from '@ors/components/theme/Loading/Loading'
import ProjectsEdit from './ProjectsEdit'
import { useGetProject } from '../hooks/useGetProject'

import { Redirect, useParams } from 'wouter'
import { isNull } from 'lodash'

const ProjectsPostExComUpdateWrapper = () => {
  const { project_id } = useParams<Record<string, string>>()

  const project = useGetProject(project_id)
  const { data, loading } = project

  if (
    project?.error ||
    (data &&
      (!data.editable ||
        !isNull(data.latest_project) ||
        data.submission_status !== 'Approved' ||
        data.status === 'Closed' ||
        data.status === 'Transferred'))
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
        <ProjectsEdit project={data} mode={'edit'} postExComUpdate={true} />
      )}
    </>
  )
}

export default ProjectsPostExComUpdateWrapper
