import { useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import CreateActionButtons from './CreateActionButtons'
import EditActionButtons from './EditActionButtons'
import {
  PageTitle,
  ProjectStatusInfo,
  RedirectBackButton,
  VersionsList,
} from '../HelperComponents'
import { getDefaultImpactErrors, getIsSaveDisabled } from '../utils'
import {
  ProjectFile,
  ProjectSpecificFields,
  ProjectTypeApi,
  ProjectHeader,
  TrancheErrorType,
} from '../interfaces'

import { CircularProgress } from '@mui/material'
import dayjs from 'dayjs'

const ProjectsHeader = ({
  projectData,
  mode,
  postExComUpdate = false,
  project,
  files,
  setProjectFiles = () => {},
  trancheErrors,
  specificFields,
  approvalFields,
  ...rest
}: ProjectHeader & {
  mode: string
  postExComUpdate?: boolean
  trancheErrors?: TrancheErrorType
  project?: ProjectTypeApi
  setProjectFiles?: (value: ProjectFile[]) => void
  approvalFields?: ProjectSpecificFields[]
}) => {
  const { projIdentifiers, crossCuttingFields, projectSpecificFields } =
    projectData
  const { project_start_date, project_end_date } = crossCuttingFields

  const defaultImpactErrors = getDefaultImpactErrors(
    projectSpecificFields,
    specificFields,
  )
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

  const isSubmitDisabled = isSaveDisabled || !!trancheErrors?.errorText

  const [projectTitle, setProjectTitle] = useState<string>(
    project?.title ?? 'N/A',
  )
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showVersionsMenu, setShowVersionsMenu] = useState(false)

  const pageTitleExtraInfo =
    mode === 'copy'
      ? '(copy)'
      : mode === 'full-link' || mode === 'partial-link'
        ? `(component of ${projectTitle ?? 'New project'})`
        : ''

  return (
    <HeaderTitle>
      <div className="align-center flex flex-wrap justify-between gap-x-4 gap-y-4">
        <div className="flex flex-col">
          <RedirectBackButton />
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <PageHeading>
              {mode === 'edit' && (
                <PageTitle
                  pageTitle={
                    postExComUpdate ? 'Post ExCom update' : 'Edit project'
                  }
                  projectTitle={projectTitle}
                  project={project as ProjectTypeApi}
                />
              )}
              {mode !== 'edit' &&
                'New project submission ' + pageTitleExtraInfo}
            </PageHeading>
            {mode === 'edit' && project && (
              <VersionsList
                {...{ project, showVersionsMenu, setShowVersionsMenu }}
              />
            )}
          </div>
        </div>
        <div className="ml-auto mt-auto flex items-center gap-2.5">
          {mode !== 'edit' ? (
            <CreateActionButtons
              {...{
                projectData,
                isSaveDisabled,
                setIsLoading,
                files,
                mode,
                specificFields,
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
                setProjectTitle,
                trancheErrors,
                specificFields,
                approvalFields,
                postExComUpdate,
              }}
              {...rest}
            />
          )}
          {isLoading && (
            <CircularProgress color="inherit" size="30px" className="ml-1.5" />
          )}
        </div>
      </div>
      {mode === 'edit' && project && <ProjectStatusInfo {...{ project }} />}
    </HeaderTitle>
  )
}

export default ProjectsHeader
