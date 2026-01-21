import { useContext, useState } from 'react'

import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { handleErrors } from '../../ProjectsEnterprises/FormHelperComponents'
import CancelWarningModal from '../../ProjectSubmission/CancelWarningModal'
import { SubmitButton } from '../../HelperComponents'
import { EnterpriseActionButtons, EnterpriseOverview } from '../../interfaces'
import { api } from '@ors/helpers'

import { enqueueSnackbar } from 'notistack'
import { useLocation } from 'wouter'

const EnterpriseCreateActionButtons = ({
  enterpriseData,
  setEnterpriseId,
  setIsLoading,
  setErrors,
  setOtherErrors,
}: EnterpriseActionButtons & { enterpriseData: EnterpriseOverview }) => {
  const [_, setLocation] = useLocation()
  const { canEditEnterprise } = useContext(PermissionsContext)

  const { updatedFields, clearUpdatedFields } = useUpdatedFields()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const onCancel = () => {
    if (updatedFields.size > 0) {
      setIsCancelModalOpen(true)
    } else {
      setLocation('/projects-listing/enterprises')
    }
  }

  const createEnterprise = async () => {
    setIsLoading(true)
    setErrors({})
    setOtherErrors('')

    try {
      const result = await api('api/enterprises/', {
        data: enterpriseData,
        method: 'POST',
      })

      setEnterpriseId(result.id)
      enqueueSnackbar(<>Enterprise was created successfully.</>, {
        variant: 'success',
      })
      clearUpdatedFields()
      setLocation(`/projects-listing/enterprises/${result.id}/edit`)
    } catch (error) {
      await handleErrors(error, setEnterpriseId, setErrors, setOtherErrors)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5">
      <CancelLinkButton title="Cancel" href={null} onClick={onCancel} />
      {canEditEnterprise && (
        <SubmitButton
          title="Create enterprise"
          isDisabled={!enterpriseData.name}
          onSubmit={createEnterprise}
          className="!py-2"
        />
      )}
      {isCancelModalOpen && (
        <CancelWarningModal
          mode="enterprise creation"
          url="/projects-listing/enterprises"
          isModalOpen={isCancelModalOpen}
          setIsModalOpen={setIsCancelModalOpen}
        />
      )}
    </div>
  )
}

export default EnterpriseCreateActionButtons
