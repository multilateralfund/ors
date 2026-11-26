import { useContext, useState } from 'react'

import CancelWarningModal from '@ors/components/manage/Blocks/ProjectsListing/ProjectSubmission/CancelWarningModal'
import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import WorkflowButtons from '../PCRWorkflow/WorkflowButtons'
import { PCRActionButtons } from '../interfaces'
import { useEditPCR } from './useEditPCR'

import { useLocation } from 'wouter'

const PCREditActionButtons = ({ setIsLoading }: PCRActionButtons) => {
  const [_, setLocation] = useLocation()
  const { pcrMetaproject, updatedSections } = useContext(PCRDataContext)
  const metaProjectId = pcrMetaproject.data?.id

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const isSaveDisabled = !metaProjectId

  const editPCR = useEditPCR(setIsLoading)

  const onCancel = () => {
    if (updatedSections.size > 0) {
      setIsCancelModalOpen(true)
    } else {
      setLocation('/pcr')
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5">
      <CancelLinkButton title="Cancel" href={null} onClick={onCancel} />
      <SubmitButton
        title="Save PCR"
        onSubmit={() => editPCR()}
        isDisabled={isSaveDisabled}
        className="!py-2"
      />
      <WorkflowButtons {...{ editPCR, isSaveDisabled }} />
      {isCancelModalOpen && setIsCancelModalOpen && (
        <CancelWarningModal
          mode="PCR updating"
          isModalOpen={isCancelModalOpen}
          setIsModalOpen={setIsCancelModalOpen}
        />
      )}
    </div>
  )
}

export default PCREditActionButtons
