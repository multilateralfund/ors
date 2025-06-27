import { useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import {
  HeaderTag,
  VersionsDropdown,
} from '../ProjectVersions/ProjectVersionsComponents'
import CreateActionButtons from './CreateActionButtons'
import EditActionButtons from './EditActionButtons'
import { PageTitle, RedirectBackButton } from '../HelperComponents'
import { getDefaultImpactErrors, getIsSaveDisabled } from '../utils'
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

  const {
    title,
    versions = [],
    version = 0,
    latest_project = null,
    submission_status,
  } = project || {}

  const [projectTitle, setProjectTitle] = useState<string>(title ?? 'N/A')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showVersionsMenu, setShowVersionsMenu] = useState(false)

  const pageTitleExtraInfo =
    mode === 'copy'
      ? '(copy)'
      : mode === 'full-link' || mode === 'partial-link'
        ? `(component of ${projectTitle ?? 'New project'})`
        : ''

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
        <div className="flex flex-col">
          <RedirectBackButton />
          <div className="flex gap-2">
            <PageHeading>
              {mode === 'edit' && (
                <PageTitle
                  pageTitle="Edit project"
                  projectTitle={projectTitle}
                  project={project as ProjectTypeApi}
                />
              )}
              {mode !== 'edit' &&
                'New project submission ' + pageTitleExtraInfo}
            </PageHeading>
            {mode === 'edit' &&
              (version > 1 || lowerCase(submission_status) !== 'draft') &&
              Versions}
          </div>
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
                setProjectTitle,
              }}
              {...rest}
            />
          )}
          {isLoading && (
            <CircularProgress color="inherit" size="30px" className="ml-1.5" />
          )}
        </div>
      </div>
      {mode === 'edit' && (
        <div className="mt-4 flex gap-3">
          <div className="flex items-center gap-3">
            <span>Submission status:</span>
            <span className="rounded border border-solid border-[#002A3C] p-1 font-medium uppercase leading-none text-[#002A3C]">
              {project?.submission_status}
            </span>
          </div>

          <span>|</span>

          <div className="flex items-center gap-3">
            <span>Project status:</span>
            <span className="rounded border border-solid border-[#002A3C] p-1 font-medium uppercase leading-none text-[#002A3C]">
              {project?.status}
            </span>
          </div>
        </div>
      )}
    </HeaderTitle>
  )
}

export default ProjectsHeader
