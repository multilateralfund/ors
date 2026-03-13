import { useContext } from 'react'

import { ProjectTypeApi } from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ProjectMyaUpdatesView from './ProjectMyaUpdatesView'
import { MetaProjectDetailType } from '../UpdateMyaData/types'
import ProjectMyaUpdatesEdit from './ProjectMyaUpdatesEdit'

const ProjectMyaUpdate = ({
  project,
  metaprojectData,
  mode,
}: {
  project?: ProjectTypeApi
  metaprojectData?: MetaProjectDetailType | null
  mode: string
}) => {
  const { canViewMetaProjects } = useContext(PermissionsContext)

  const hasMetaProject = !!metaprojectData && !metaprojectData.detail

  console.log(metaprojectData)

  if (!hasMetaProject || !canViewMetaProjects) {
    return <>This project has no metaproject associated.</>
  }

  return (
    <div className="flex w-full flex-wrap gap-4">
      <span className="flex-1 rounded-lg bg-[#F5F5F5] px-6 py-2">
        {mode === 'view' ? (
          <ProjectMyaUpdatesView {...{ metaprojectData }} />
        ) : (
          <ProjectMyaUpdatesEdit {...{ metaprojectData }} />
        )}
      </span>
    </div>
  )
}

export default ProjectMyaUpdate
