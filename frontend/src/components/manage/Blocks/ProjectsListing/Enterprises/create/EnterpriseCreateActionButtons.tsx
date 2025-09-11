import { useContext } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { SubmitButton } from '../../HelperComponents'
import { EnterpriseActionButtons, EnterpriseOverview } from '../../interfaces'
import { api } from '@ors/helpers'

import { enqueueSnackbar } from 'notistack'
import { useLocation } from 'wouter'

const EnterpriseCreateActionButtons = ({
  enterpriseData,
  setEnterpriseId,
  setIsLoading,
  setHasSubmitted,
  setErrors,
  setOtherErrors,
}: EnterpriseActionButtons & { enterpriseData: EnterpriseOverview }) => {
  const [_, setLocation] = useLocation()
  const { canEditEnterprise } = useContext(PermissionsContext)

  const createEnterprise = async () => {
    setIsLoading(true)
    setOtherErrors('')
    setErrors({})

    try {
      const result = await api(`api/enterprises/`, {
        data: enterpriseData,
        method: 'POST',
      })
      setEnterpriseId(result.id)
      setLocation(`/projects-listing/enterprises/${result.id}/edit`)
    } catch (error) {
      const errors = await error.json()

      if (error.status === 400) {
        setErrors(errors)

        if (errors?.details) {
          setOtherErrors(errors.details)
        }
      }

      setEnterpriseId(null)
      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
      setHasSubmitted(true)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <CancelLinkButton title="Cancel" href="/projects-listing/enterprises" />
      {canEditEnterprise && (
        <SubmitButton
          title="Create enterprise"
          isDisabled={!enterpriseData.name}
          onSubmit={createEnterprise}
          className="ml-auto"
        />
      )}
    </div>
  )
}

export default EnterpriseCreateActionButtons
