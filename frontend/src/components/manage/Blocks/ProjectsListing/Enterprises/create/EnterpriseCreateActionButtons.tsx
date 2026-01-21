import { useContext } from 'react'

import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
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
  const { clearUpdatedFields } = useUpdatedFields()

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
    canEditEnterprise && (
      <SubmitButton
        title="Create enterprise"
        isDisabled={!enterpriseData.name}
        onSubmit={createEnterprise}
        className="!py-2"
      />
    )
  )
}

export default EnterpriseCreateActionButtons
