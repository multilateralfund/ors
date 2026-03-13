import { useContext } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import ProjectRelatedProjectsMetaProject from './ProjectRelatedProjectsMetaProject'
import { MetaProjectDetailType } from '../UpdateMyaData/types'
import { ProjectTypeApi } from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'

const ProjectMyaUpdate = ({
  project,
  metaprojectData,
  mode,
}: {
  project?: ProjectTypeApi
  metaprojectData?: MetaProjectDetailType | null
  mode?: string
}) => {
  const { canViewMetaProjects } = useContext(PermissionsContext)

  const isEditMode = mode === 'edit' && !!project
  const hasMetaProject = isEditMode && !!project.meta_project_id

  return (
    <>
      {hasMetaProject && canViewMetaProjects && (
        <div className="flex w-full flex-wrap gap-4">
          <span className="rounded-lg bg-[#F5F5F5] p-6 xl:flex-1">
            <ProjectRelatedProjectsMetaProject {...{ metaprojectData }} />
          </span>
        </div>
      )}
    </>
  )
}

export default ProjectMyaUpdate
