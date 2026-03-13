import { useContext } from 'react'

import { ProjectTypeApi } from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ProjectMyaUpdatesView from './ProjectMyaUpdatesView'
import { MetaProjectDetailType } from '../UpdateMyaData/types'

import { Typography } from '@mui/material'

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

  const hasMetaProject =
    (mode === 'edit' || mode === 'view') && !!project?.meta_project_id
  const hasNoMetaPossibleMetaProject =
    !hasMetaProject && !!metaprojectData?.detail

  if (
    !canViewMetaProjects ||
    (!hasMetaProject && hasNoMetaPossibleMetaProject)
  ) {
    return (
      <Typography variant="h6">
        Could not find a corresponding meta-project.
      </Typography>
    )
  }

  return (
    <div className="flex w-full flex-wrap gap-4">
      <span className="flex-1 rounded-lg bg-[#F5F5F5] px-6 py-2">
        <ProjectMyaUpdatesView {...{ metaprojectData, mode }} />
      </span>
    </div>
  )
}

export default ProjectMyaUpdate
