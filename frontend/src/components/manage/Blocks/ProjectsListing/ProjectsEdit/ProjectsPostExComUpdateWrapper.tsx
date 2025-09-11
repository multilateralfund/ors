import { useContext } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ProjectsEdit from './ProjectsEdit'
import { useGetProject } from '../hooks/useGetProject'

import { Redirect, useParams } from 'wouter'
import { isNull } from 'lodash'

const ProjectsPostExComUpdateWrapper = () => {
  const { project_id } = useParams<Record<string, string>>()

  const project = useGetProject(project_id)
  const { data, loading } = project

  if (project?.error) {
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
