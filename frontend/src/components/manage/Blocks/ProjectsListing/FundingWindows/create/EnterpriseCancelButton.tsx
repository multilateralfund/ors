import { useState } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import CancelWarningModal from '../../ProjectSubmission/CancelWarningModal'
import { RedirectBackButton } from '../../HelperComponents'

import { useLocation, useParams } from 'wouter'

const EnterpriseCancelButton = ({
  type,
  mode,
  isEdit,
}: {
  type: string
  mode: string
  isEdit: boolean
}) => {
  const [_, setLocation] = useLocation()
  const { updatedFields } = useUpdatedFields()
  const { project_id } = useParams<Record<string, string>>()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const isRedirect = mode === 'redirect'
  const listingUrl =
    type === 'enterprise' ? 'enterprises' : `projects-enterprises/${project_id}`

  const onCancel = () => {
    if (updatedFields.size > 0) {
      setIsCancelModalOpen(true)
    } else {
      setLocation(`/projects-listing/${isRedirect ? 'listing' : listingUrl}`)
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
          mode={`${type} ${isEdit ? 'editing' : 'creation'}`}
          url={!isRedirect ? `/projects-listing/${listingUrl}` : undefined}
          isModalOpen={isCancelModalOpen}
          setIsModalOpen={setIsCancelModalOpen}
        />
      )}
    </>
  )
}

export default EnterpriseCancelButton
