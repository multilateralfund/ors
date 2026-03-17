import { ProjectTypeApi } from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import ProjectMyaUpdatesView from './ProjectMyaUpdatesView'
import { MetaProjectDetailType } from '../UpdateMyaData/types'

import { Typography } from '@mui/material'

const ProjectMyaUpdate = ({
  project,
  metaprojectData,
  mode,
}: {
  project?: ProjectTypeApi
  metaprojectData: MetaProjectDetailType | null
  mode: string
}) => {
  const hasMetaProject =
    ['edit', 'view'].includes(mode) && !!project?.meta_project_id
  const hasNoPossibleMetaProject = !hasMetaProject && !!metaprojectData?.detail

  if (!hasMetaProject && hasNoPossibleMetaProject) {
    return (
      <Typography variant="h6">
        Could not find a corresponding meta-project.
      </Typography>
    )
  }

  return (
    <div className="bg-common-containerBg rounded-lg px-6 py-2">
      <ProjectMyaUpdatesView {...{ metaprojectData, mode }} />
    </div>
  )
}

export default ProjectMyaUpdate
