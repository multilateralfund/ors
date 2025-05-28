import { Dispatch, SetStateAction, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import {
  HeaderTag,
  VersionsDropdown,
} from '../ProjectVersions/ProjectVersionsComponents'
import CreateActionButtons from './CreateActionButtons'
import EditActionButtons from './EditActionButtons'
import { getIsSubmitDisabled } from '../utils'
import { ProjectData, ProjectFilesObject, ProjectTypeApi } from '../interfaces'

import { CircularProgress } from '@mui/material'

const ProjectsHeader = ({
  projectData,
  mode,
  files,
  setErrors,
  setProjectId = () => {},
  setHasSubmitted,
  project,
}: {
  projectData: ProjectData
  mode: string
  files: ProjectFilesObject
  setErrors: Dispatch<SetStateAction<{ [key: string]: [] }>>
  setHasSubmitted: Dispatch<SetStateAction<boolean>>
  setProjectId?: Dispatch<SetStateAction<number | null>>
  project?: ProjectTypeApi
}) => {
  const { projIdentifiers, crossCuttingFields } = projectData
  const isSubmitDisabled = getIsSubmitDisabled(
    projIdentifiers,
    crossCuttingFields,
  )

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
        <div className="flex flex-wrap items-center gap-2.5">
          {mode !== 'edit' ? (
            <CreateActionButtons
              {...{
                projectData,
                files,
                setProjectId,
                isSubmitDisabled,
                setIsLoading,
                setErrors,
                setHasSubmitted,
              }}
            />
          ) : (
            <EditActionButtons
              project={project as ProjectTypeApi}
              {...{
                projectData,
                files,
                isSubmitDisabled,
                setIsLoading,
                setHasSubmitted,
              }}
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
