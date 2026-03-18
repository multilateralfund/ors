import {
  InlineMessageType,
  MpDataProps,
  ProjectTypeApi,
} from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import ProjectMyaUpdatesView from './ProjectMyaUpdatesView'
import { defaultMetaprojectFieldData } from '../constants'
import { MetaProjectDetailType } from '../UpdateMyaData/types'

const ProjectMyaUpdate = ({
  project,
  metaprojectData,
  mpData,
  setMpData,
  mode,
  setSuccessMessage,
}: MpDataProps & {
  project?: ProjectTypeApi
  metaprojectData: MetaProjectDetailType | null
  mode: string
  setSuccessMessage: (message: InlineMessageType) => void
}) => {
  const hasMetaProject =
    ['edit', 'view'].includes(mode) && !!project?.meta_project_id
  const hasNoPossibleMetaProject = !hasMetaProject && !!metaprojectData?.detail
  const hasNoMetaproject = !hasMetaProject && hasNoPossibleMetaProject

  const formattedMetaprojectData = hasNoMetaproject
    ? {
        field_data: defaultMetaprojectFieldData,
      }
    : metaprojectData

  return (
    <div className="rounded-lg bg-common-containerBg px-6 py-2">
      <ProjectMyaUpdatesView
        metaprojectData={formattedMetaprojectData}
        {...{ mode, mpData, setMpData, setSuccessMessage }}
      />
    </div>
  )
}

export default ProjectMyaUpdate
