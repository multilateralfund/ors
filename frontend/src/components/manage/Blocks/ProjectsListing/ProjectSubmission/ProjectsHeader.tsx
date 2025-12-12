import { useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import Link from '@ors/components/ui/Link/Link'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import CreateActionButtons from './CreateActionButtons'
import CancelWarningModal from './CancelWarningModal'
import EditActionButtons from './EditActionButtons'
import { PageTitle, ProjectStatusInfo, VersionsList } from '../HelperComponents'
import { getDefaultImpactErrors, getIsSaveDisabled } from '../utils'
import {
  ProjectFile,
  ProjectSpecificFields,
  ProjectTypeApi,
  ProjectHeader,
  TrancheErrorType,
  BpDataProps,
} from '../interfaces'
import { useStore } from '@ors/store'

import { IoReturnUpBack } from 'react-icons/io5'
import { CircularProgress } from '@mui/material'
import { useLocation } from 'wouter'
import { find } from 'lodash'

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
  bpData,
  filesMetaData,
  loadedFiles,
  ...rest
}: ProjectHeader & {
  mode: string
  setParams?: any
  postExComUpdate?: boolean
  trancheErrors?: TrancheErrorType
  project?: ProjectTypeApi
  setProjectFiles?: (value: ProjectFile[]) => void
  approvalFields?: ProjectSpecificFields[]
  bpData: BpDataProps
  loadedFiles?: boolean
}) => {
  const [_, setLocation] = useLocation()

  const userSlice = useStore((state) => state.user)
  const { agency_id } = userSlice.data

  const { updatedFields } = useUpdatedFields()

  const { projIdentifiers, crossCuttingFields, projectSpecificFields } =
    projectData

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
    agency_id,
  )
  const hasTrancheErrors =
    !!trancheErrors?.errorText || !!trancheErrors?.loading

  const isSaveDisabled =
    (mode !== 'add' && !loadedFiles) ||
    hasMissingRequiredFields ||
    hasValidationErrors ||
    bpData.bpDataLoading ||
    !!find(filesMetaData, (metadata) => !metadata.type) ||
    (mode === 'edit' && (project?.version ?? 0) >= 2 && hasTrancheErrors)

  const isSubmitDisabled = isSaveDisabled || hasTrancheErrors

  const [projectTitle, setProjectTitle] = useState<string>(
    project?.title ?? 'N/A',
  )
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showVersionsMenu, setShowVersionsMenu] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const pageTitleExtraInfo =
    mode === 'copy'
      ? '(copy)'
      : mode === 'full-link' || mode === 'partial-link'
        ? `(component of ${projectTitle ?? 'New project'})`
        : ''

  const onCancel = () => {
    if (updatedFields.size > 0) {
      setIsCancelModalOpen(true)
    } else {
      setLocation('/projects-listing/listing')
    }
  }

  return (
    <HeaderTitle>
      <div className="align-center flex flex-wrap justify-between gap-x-4 gap-y-4">
        <div className="flex flex-col">
          <div className="w-fit">
            <Link
              className="cursor-pointer text-black no-underline"
              onClick={onCancel}
            >
              <div className="mb-3 flex items-center gap-2 text-lg uppercase tracking-[0.05em]">
                <IoReturnUpBack size={18} />
                IA/BA Portal
              </div>
            </Link>
          </div>

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
        {isCancelModalOpen && (
          <CancelWarningModal
            mode={mode === 'edit' ? 'editing' : 'creation'}
            isModalOpen={isCancelModalOpen}
            setIsModalOpen={setIsCancelModalOpen}
          />
        )}
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
                filesMetaData,
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
                bpData,
                filesMetaData,
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
