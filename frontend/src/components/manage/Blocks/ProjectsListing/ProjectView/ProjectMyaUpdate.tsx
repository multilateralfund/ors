import { ProjectTypeApi } from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import ProjectMyaUpdatesView from './ProjectMyaUpdatesView'
import { defaultMetaprojectFieldData } from '../constants'
import { getHasNoMetaproject } from '../utils'
import { MetaProjectDetailType } from '../UpdateMyaData/types'

const ProjectMyaUpdate = ({
  project,
  metaprojectData,
  mode,
  ...rest
}: {
  project?: ProjectTypeApi
  metaprojectData: MetaProjectDetailType | null
  mode: string
}) => {
  const hasNoMetaproject = getHasNoMetaproject(metaprojectData, project, mode)
  const formattedMetaprojectData = hasNoMetaproject
    ? {
        field_data: defaultMetaprojectFieldData,
      }
    : metaprojectData

  return (
    <div className="rounded-lg bg-common-containerBg px-6 py-2">
      <ProjectMyaUpdatesView
        metaprojectData={formattedMetaprojectData}
        {...{ mode, ...rest }}
      />
    </div>
  )
}

export default ProjectMyaUpdate
