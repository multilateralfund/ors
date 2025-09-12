import { useContext } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { handleErrors } from '../../Enterprises/FormHelperComponents'
import { SubmitButton } from '../../HelperComponents'
import { EnterpriseActionButtons, PEnterpriseData } from '../../interfaces'
import { api } from '@ors/helpers'

import { useLocation, useParams } from 'wouter'
import { omit } from 'lodash'

const PEnterpriseCreateActionButtons = ({
  enterpriseData,
  setEnterpriseId,
  setIsLoading,
  setHasSubmitted,
  setErrors,
  setOtherErrors,
}: EnterpriseActionButtons & { enterpriseData: PEnterpriseData }) => {
  const [_, setLocation] = useLocation()
  const { canEditProjectEnterprise } = useContext(PermissionsContext)

  const { project_id } = useParams<Record<string, string>>()

  const createEnterprise = async () => {
    setIsLoading(true)
    setErrors({})
    setOtherErrors('')

    try {
      const { overview, substance_details, funding_details } = enterpriseData

      const data = {
        project: project_id,
        enterprise: omit(overview, 'status'),
        ods_odp: substance_details,
        ...funding_details,
      }

      const result = await api(`api/project-enterprise/`, {
        data: data,
        method: 'POST',
      })
      setEnterpriseId(result.id)
      setLocation(
        `/projects-listing/projects-enterprises/${project_id}/edit/${result.id}`,
      )
    } catch (error) {
      await handleErrors(error, setEnterpriseId, setErrors, setOtherErrors)
    } finally {
      setIsLoading(false)
      setHasSubmitted(true)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <CancelLinkButton
        title="Cancel"
        href={`/projects-listing/projects-enterprises/${project_id}`}
      />
      {canEditProjectEnterprise && (
        <SubmitButton
          title="Create project enterprise"
          isDisabled={!enterpriseData.overview.name}
          onSubmit={createEnterprise}
          className="ml-auto"
        />
      )}
    </div>
  )
}

export default PEnterpriseCreateActionButtons
