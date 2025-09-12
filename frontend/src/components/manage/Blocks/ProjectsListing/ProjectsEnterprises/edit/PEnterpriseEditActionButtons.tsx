import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import EnterpriseCommonEditActionButtons from '../../Enterprises/edit/EnterpriseCommonEditActionButtons'
import { handleErrors } from '../../Enterprises/FormHelperComponents'
import {
  EnterpriseActionButtons,
  EnterpriseType,
  PEnterpriseData,
  PEnterpriseType,
} from '../../interfaces'
import { api } from '@ors/helpers'

import { useLocation, useParams } from 'wouter'
import { enqueueSnackbar } from 'notistack'
import { omit } from 'lodash'

const PEnterpriseEditActionButtons = ({
  enterpriseData,
  enterprise,
  setEnterpriseId,
  setEnterpriseName,
  setIsLoading,
  setHasSubmitted,
  setErrors,
  setOtherErrors,
}: EnterpriseActionButtons & {
  enterpriseData: PEnterpriseData
  enterprise?: PEnterpriseType
  setEnterpriseName: (name: string) => void
}) => {
  const { project_id, enterprise_id } = useParams<Record<string, string>>()
  const [_, setLocation] = useLocation()

  const { status } = enterprise ?? {}
  const isPending = status === 'Pending Approval'
  const isApproved = status === 'Approved'

  const overview = enterpriseData.overview as EnterpriseType
  const disableSubmit = !(overview.name && overview.id)

  const editEnterprise = async () => {
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

      const result = await api(`api/project-enterprise/${enterprise_id}/`, {
        data: data,
        method: 'PUT',
      })

      setEnterpriseId(result.id)
      setEnterpriseName(result.enterprise.name)

      return true
    } catch (error) {
      await handleErrors(error, setEnterpriseId, setErrors, setOtherErrors)

      return false
    } finally {
      setIsLoading(false)
      setHasSubmitted(true)
    }
  }

  const changeEnterpriseStatus = async (status: string) => {
    const canChangeStatus = isPending ? await editEnterprise() : true

    if (canChangeStatus) {
      try {
        if (status === 'Approved') {
          await api(`api/project-enterprise/${enterprise_id}/approve/`, {
            method: 'POST',
          })
        }

        if (isPending && status === 'Obsolete') {
          await api(`api/project-enterprise/${enterprise_id}/not_approve/`, {
            method: 'POST',
          })
        }

        if (isApproved && status === 'Obsolete') {
          await api(`api/project-enterprise/${enterprise_id}/obsolete/`, {
            method: 'POST',
          })
        }

        setLocation(
          `/projects-listing/projects-enterprises/${project_id}/view/${enterprise_id}`,
        )
      } catch (error) {
        enqueueSnackbar(
          <>Could not change project enterprise status. Please try again.</>,
          {
            variant: 'error',
          },
        )
      }
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <CancelLinkButton
        title="Cancel"
        href={`/projects-listing/projects-enterprises/${project_id}/view/${enterprise_id}`}
      />
      <EnterpriseCommonEditActionButtons
        type="project-enterprise"
        status={enterprise?.status ?? ''}
        disableButton={disableSubmit}
        handleEdit={editEnterprise}
        handleChangeStatus={changeEnterpriseStatus}
      />
    </div>
  )
}

export default PEnterpriseEditActionButtons
