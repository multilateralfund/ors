import { useState } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import CancelWarningModal from '../../ProjectSubmission/CancelWarningModal'
import { RedirectBackButton } from '../../HelperComponents'

import { useLocation } from 'wouter'

const EnterpriseCancelButton = ({
  mode,
  isEdit,
}: {
  mode: string
  isEdit: boolean
}) => {
  const [_, setLocation] = useLocation()
  const { updatedFields } = useUpdatedFields()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const isRedirect = mode === 'redirect'

  const onCancel = () => {
    if (updatedFields.size > 0) {
      setIsCancelModalOpen(true)
    } else {
      setLocation(`/projects-listing/${isRedirect ? 'listing' : 'enterprises'}`)
    }
  }

  return (
    <>
      {isRedirect ? (
        <RedirectBackButton withRedirect={false} onAction={onCancel} />
      ) : (
        <CancelLinkButton title="Cancel" href={null} onClick={onCancel} />
      )}
      {isCancelModalOpen && (
        <CancelWarningModal
          mode={`enterprise ${isEdit ? 'editing' : 'creation'}`}
          url={!isRedirect ? '/projects-listing/enterprises' : undefined}
          isModalOpen={isCancelModalOpen}
          setIsModalOpen={setIsCancelModalOpen}
        />
      )}
    </>
  )
}

export default EnterpriseCancelButton
