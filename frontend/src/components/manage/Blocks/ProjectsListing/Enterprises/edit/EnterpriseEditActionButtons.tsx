import { useContext, useState } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import EnterpriseCommonEditActionButtons from './EnterpriseCommonEditActionButtons'
import { handleErrors } from '../../ProjectsEnterprises/FormHelperComponents'
import {
  EnterpriseActionButtons,
  EnterpriseOverview,
  EnterpriseType,
} from '../../interfaces'
import { api } from '@ors/helpers'

import { useLocation, useParams } from 'wouter'
import { enqueueSnackbar } from 'notistack'

const EnterpriseEditActionButtons = ({
  enterpriseData,
  enterprise,
  setEnterpriseId,
  setEnterpriseName,
  setIsLoading,
  setHasSubmitted,
  setErrors,
  setOtherErrors,
}: EnterpriseActionButtons & {
  enterpriseData: EnterpriseOverview
  enterprise?: EnterpriseType
  setEnterpriseName: (name: string) => void
}) => {
  const { enterprise_id } = useParams<Record<string, string>>()
  const [_, setLocation] = useLocation()

  const { canEditEnterprise } = useContext(PermissionsContext)

  const [isObsoleteWarningOpen, setIsObsoleteWarningOpen] = useState(false)

  const { status } = enterprise ?? {}
  const isPending = status === 'Pending Approval'

  const disableSubmit = !enterpriseData.name

  const editEnterprise = async () => {
    setIsLoading(true)
    setErrors({})
    setOtherErrors('')

    try {
      const result = await api(`api/enterprises/${enterprise_id}/`, {
        data: enterpriseData,
        method: 'PUT',
      })

      setEnterpriseId(result.id)
      setEnterpriseName(result.name)

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
    const canChangeStatus =
      isPending && canEditEnterprise ? await editEnterprise() : true

    if (canChangeStatus) {
      try {
        await api(`api/enterprises/${enterprise_id}/change_status/`, {
          data: { status },
          method: 'POST',
        })

        setLocation(`/projects-listing/enterprises/${enterprise_id}`)
      } catch (error) {
        enqueueSnackbar(
          <>Could not change enterprise status. Please try again.</>,
          {
            variant: 'error',
          },
        )
      }
    }

    setIsObsoleteWarningOpen(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <CancelLinkButton
        title="Cancel"
        href={`/projects-listing/enterprises/${enterprise_id}`}
      />
      <EnterpriseCommonEditActionButtons
        type="enterprise"
        status={status ?? ''}
        disableButton={disableSubmit}
        handleEdit={editEnterprise}
        handleChangeStatus={changeEnterpriseStatus}
        {...{ isObsoleteWarningOpen, setIsObsoleteWarningOpen }}
      />
    </div>
  )
}

export default EnterpriseEditActionButtons
