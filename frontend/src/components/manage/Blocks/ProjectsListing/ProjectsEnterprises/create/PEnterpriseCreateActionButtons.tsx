import { useContext } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { SubmitButton } from '../../HelperComponents'
import { EnterpriseActionButtons } from '../../interfaces'
import { api } from '@ors/helpers'

import { useLocation, useParams } from 'wouter'
import { enqueueSnackbar } from 'notistack'

const PEnterpriseCreateActionButtons = ({
  enterpriseData,
  setEnterpriseId,
  setIsLoading,
  setHasSubmitted,
  setErrors,
  setOtherErrors,
}: EnterpriseActionButtons) => {
  const [_, setLocation] = useLocation()
  const { project_id } = useParams<Record<string, string>>()
  const { canEditEnterprise } = useContext(PermissionsContext)

  const { overview } = enterpriseData

  const createEnterprise = async () => {
    setIsLoading(true)
    setOtherErrors('')
    setErrors({})

    try {
      const { overview, substance_details, remarks, ...rest } = enterpriseData

      const data = {
        project: project_id,
        ...Object.assign({}, ...Object.values(rest)),
        ods_odp: substance_details,
        enterprise: { ...overview, ...remarks },
      }

      const result = await api(`api/project-enterprise/`, {
        data: data,
        method: 'POST',
      })
      setEnterpriseId(result.id)
      setLocation(
        `/projects-listing/enterprises/${project_id}/edit/${result.id}`,
      )
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
      <CancelLinkButton
        title="Cancel"
        href={`/projects-listing/enterprises/${project_id}`}
      />
      {canEditEnterprise && (
        <SubmitButton
          title="Create enterprise"
          isDisabled={!overview.name}
          onSubmit={createEnterprise}
          className="ml-auto"
        />
      )}
    </div>
  )
}

export default PEnterpriseCreateActionButtons
