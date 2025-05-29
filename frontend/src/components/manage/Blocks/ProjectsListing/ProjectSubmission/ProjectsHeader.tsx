import { Dispatch, SetStateAction, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import {
  HeaderTag,
  VersionsDropdown,
} from '../ProjectVersions/ProjectVersionsComponents'
import CreateActionButtons from './CreateActionButtons'
import EditActionButtons from './EditActionButtons'
import { getDefaultImpactErrors, getIsSubmitDisabled } from '../utils'
import { ProjectData, ProjectFilesObject, ProjectTypeApi } from '../interfaces'

import { CircularProgress } from '@mui/material'
import dayjs from 'dayjs'

const ProjectsHeader = ({
  projectData,
  mode,
  project,
  files,
  hasNoFiles,
  ...rest
}: {
  projectData: ProjectData
  mode: string
  files: ProjectFilesObject
  setErrors: Dispatch<SetStateAction<{ [key: string]: [] }>>
  setHasSubmitted: Dispatch<SetStateAction<boolean>>
  setFileErrors: Dispatch<SetStateAction<string>>
  hasNoFiles: boolean
  setProjectId: Dispatch<SetStateAction<number | null>>
  project?: ProjectTypeApi
}) => {
  const { projIdentifiers, crossCuttingFields, projectSpecificFields } =
    projectData
  const { project_start_date, project_end_date } = crossCuttingFields
  const { ods_odp = [] } = projectSpecificFields

  const defaultImpactErrors = getDefaultImpactErrors(projectSpecificFields)
  const hasValidationErrors = Object.values(defaultImpactErrors).some(
    (errors) => errors.length > 0,
  )
  const hasMissingRequiredFields = getIsSubmitDisabled(
    projIdentifiers,
    crossCuttingFields,
  )
  const isSubmitDisabled =
    hasMissingRequiredFields ||
    dayjs(project_start_date).isAfter(dayjs(project_end_date)) ||
    hasValidationErrors ||
    (ods_odp.length > 0 && ods_odp.some((item) => !item.ods_substance_id)) ||
    hasNoFiles

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showVersionsMenu, setShowVersionsMenu] = useState(false)

  const {
    code,
    code_legacy,
    versions = [],
    version = 0,
    latest_project = null,
  } = project || {}

  const Versions = (
    <>
      <VersionsDropdown
        {...{ versions, showVersionsMenu, setShowVersionsMenu }}
      />
      <HeaderTag {...{ latest_project, version }} />
    </>
  )
  return (
    <HeaderTitle>
      <div className="align-center flex flex-wrap justify-between gap-x-4 gap-y-2">
        <div className="flex gap-2">
          <PageHeading>
            {mode === 'edit'
              ? `Edit ${code ?? code_legacy}`
              : 'New project submission'}
          </PageHeading>
          {mode === 'edit' && Versions}
        </div>
        <div className="flex items-center gap-2.5">
          {mode !== 'edit' ? (
            <CreateActionButtons
              {...{
                projectData,
                isSubmitDisabled,
                setIsLoading,
                files,
              }}
              {...rest}
            />
          ) : (
            <EditActionButtons
              project={project as ProjectTypeApi}
              {...{
                projectData,
                isSubmitDisabled,
                setIsLoading,
                files,
              }}
              {...rest}
            />
          )}
          {isLoading && (
            <CircularProgress color="inherit" size="30px" className="ml-1.5" />
          )}
        </div>
      </div>
    </HeaderTitle>
  )
}

export default ProjectsHeader
