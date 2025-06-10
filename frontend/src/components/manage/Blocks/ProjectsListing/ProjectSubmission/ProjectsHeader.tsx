import { useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import {
  HeaderTag,
  VersionsDropdown,
} from '../ProjectVersions/ProjectVersionsComponents'
import CreateActionButtons from './CreateActionButtons'
import EditActionButtons from './EditActionButtons'
import {
  getDefaultImpactErrors,
  getIsSaveDisabled,
  getTitleExtras,
} from '../utils'
import {
  ProjectData,
  ProjectFile,
  ProjectFilesObject,
  ProjectSpecificFields,
  ProjectTypeApi,
} from '../interfaces'

import { CircularProgress } from '@mui/material'
import { lowerCase } from 'lodash'
import dayjs from 'dayjs'

const ProjectsHeader = ({
  projectData,
  mode,
  project,
  files,
  setProjectFiles = () => {},
  ...rest
}: {
  projectData: ProjectData
  mode: string
  files: ProjectFilesObject
  setErrors: (errors: Record<string, []>) => void
  setHasSubmitted: (value: boolean) => void
  setFileErrors: (value: string) => void
  setOtherErrors: (value: string) => void
  setProjectId: (id: number | null) => void
  specificFields: ProjectSpecificFields[]
  project?: ProjectTypeApi
  setProjectFiles?: (value: ProjectFile[]) => void
}) => {
  const { projIdentifiers, crossCuttingFields, projectSpecificFields } =
    projectData
  const { project_start_date, project_end_date } = crossCuttingFields

  const defaultImpactErrors = getDefaultImpactErrors(projectSpecificFields)
  const hasValidationErrors = Object.values(defaultImpactErrors).some(
    (errors) => errors.length > 0,
  )
  const hasMissingRequiredFields = getIsSaveDisabled(
    projIdentifiers,
    crossCuttingFields,
  )
  const isSaveDisabled =
    hasMissingRequiredFields ||
    dayjs(project_start_date).isAfter(dayjs(project_end_date)) ||
    hasValidationErrors
  const isSubmitDisabled = isSaveDisabled

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showVersionsMenu, setShowVersionsMenu] = useState(false)

  const {
    title,
    versions = [],
    version = 0,
    latest_project = null,
    submission_status,
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
      <div className="align-center flex flex-wrap justify-between gap-x-4 gap-y-4">
        <div className="flex gap-2">
          <PageHeading>
            {mode === 'edit'
              ? `Edit project: ${title ?? 'N/A'}${getTitleExtras(project as ProjectTypeApi)}`
              : 'New project submission'}
          </PageHeading>
          {mode === 'edit' &&
            (version > 1 || lowerCase(submission_status) !== 'draft') &&
            Versions}
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          {mode !== 'edit' ? (
            <CreateActionButtons
              {...{
                projectData,
                isSaveDisabled,
                setIsLoading,
                files,
                mode,
              }}
              {...rest}
            />
          ) : (
            <EditActionButtons
              project={project as ProjectTypeApi}
              {...{
                projectData,
                isSaveDisabled,
                isSubmitDisabled,
                setIsLoading,
                files,
                setProjectFiles,
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
