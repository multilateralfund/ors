import { useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import { RedirectBackButton } from '../../ProjectsListing/HelperComponents'
import {
  getDefaultImpactErrors,
  getIsSaveDisabled,
} from '../../ProjectsListing/utils'
import { MAX_FILE_SIZE } from '../../ProjectsListing/constants'

import CreateActionButtons from './CreateActionButtons'
import EditActionButtons from '../edit/EditActionButtons'
import CancelWarningModal from '../../ProjectsListing/ProjectSubmission/CancelWarningModal'
import { PCRHeaderType } from '../interfaces'

import { CircularProgress } from '@mui/material'
import { useLocation } from 'wouter'
import { find } from 'lodash'

const PCRHeader = ({
  PCRData,
  mode,
  PCR,
  files,
  setProjectFiles = () => {},
  filesMetaData,
  loadedFiles,
  setPCRData,
  setErrors,
  setFileErrors,
}: PCRHeaderType) => {
  const [_, setLocation] = useLocation()

  const { updatedFields } = useUpdatedFields()

  // const { projIdentifiers, crossCuttingFields, projectSpecificFields } = PCRData

  // const defaultImpactErrors = getDefaultImpactErrors(
  //   projectSpecificFields,
  //   specificFields,
  // )
  // const hasValidationErrors = Object.values(defaultImpactErrors).some(
  //   (errors) => errors.length > 0,
  // )

  // const hasMissingRequiredFields = getIsSaveDisabled(
  //   projIdentifiers,
  //   crossCuttingFields,
  //   undefined,
  //   true,
  // )

  // const isSaveDisabled =
  //   (mode !== 'add' && !loadedFiles) ||
  //   hasMissingRequiredFields ||
  //   hasValidationErrors ||
  //   !!find(
  //     filesMetaData,
  //     (metadata) => !metadata.type || (metadata.size ?? 0) > MAX_FILE_SIZE,
  //   )

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

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
          <RedirectBackButton withRedirect={false} onAction={onCancel} />
          <PageHeading>
            {mode === 'edit' ? 'Edit PCR' : 'New PCR submission'}
          </PageHeading>
        </div>
        {isCancelModalOpen && (
          <CancelWarningModal
            mode={`PCR ${mode === 'edit' ? 'editing' : 'creation'}`}
            isModalOpen={isCancelModalOpen}
            setIsModalOpen={setIsCancelModalOpen}
          />
        )}
        <div className="ml-auto mt-auto flex items-center gap-2.5">
          {/* {mode !== 'edit' ? ( */}
          <CreateActionButtons
            isSaveDisabled={false}
            {...{
              PCRData,
              setIsLoading,
              files,
              mode,
              filesMetaData,
              setPCRData,
              setErrors,
              setFileErrors,
            }}
          />
          {/* ) : ( */}
          {/* <EditActionButtons
              project={project!}
              isSubmitDisabled={isSaveDisabled}
              {...{
                PCRData,
                isSaveDisabled,
                setIsLoading,
                files,
                setProjectFiles,
                filesMetaData,
              }}
              {...rest}
            /> */}
          {/* )}  */}
          {isLoading && (
            <CircularProgress color="inherit" size="30px" className="ml-1.5" />
          )}
        </div>
      </div>
      {mode === 'edit' && PCR && (
        <div className="mt-4 flex items-center gap-3">
          <span>Status:</span>
          <span className="rounded border border-solid border-[#002A3C] px-1 py-0.5 font-medium uppercase leading-tight text-[#002A3C]">
            {PCR.status}
          </span>
        </div>
      )}
    </HeaderTitle>
  )
}

export default PCRHeader
