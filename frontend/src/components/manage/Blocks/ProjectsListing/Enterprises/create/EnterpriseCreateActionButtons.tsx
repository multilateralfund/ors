import { useContext } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { handleErrors } from '../../ProjectsEnterprises/FormHelperComponents'
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
      setLocation(`/projects-listing/enterprises/${result.id}/edit`)
    } catch (error) {
      await handleErrors(error, setEnterpriseId, setErrors, setOtherErrors)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5">
      <CancelLinkButton title="Cancel" href="/projects-listing/enterprises" />
      {canEditEnterprise && (
        <SubmitButton
          title="Create enterprise"
          isDisabled={!enterpriseData.name}
          onSubmit={createEnterprise}
          className="!py-2"
        />
      )}
    </div>
  )
}

export default EnterpriseCreateActionButtons
