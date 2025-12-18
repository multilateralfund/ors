import { useContext } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { handleErrors } from '../FormHelperComponents'
import { dropDownClassName, enabledButtonClassname } from '../../constants'
import {
  EnterpriseActionButtons,
  PEnterpriseData,
  PEnterpriseType,
} from '../../interfaces'
import { api } from '@ors/helpers'

import { useLocation, useParams } from 'wouter'
import { enqueueSnackbar } from 'notistack'
import { Button } from '@mui/material'
import { omit } from 'lodash'
import cx from 'classnames'

const PEnterpriseEditActionButtons = ({
  enterpriseData,
  enterprise,
  setEnterpriseId,
  setEnterpriseName,
  setIsLoading,
  setErrors,
  setOtherErrors,
}: EnterpriseActionButtons & {
  enterpriseData: PEnterpriseData
  enterprise?: PEnterpriseType
  setEnterpriseName: (name: string) => void
}) => {
  const { project_id, enterprise_id } = useParams<Record<string, string>>()
  const [_, setLocation] = useLocation()

  const { canEditProjectEnterprise, canApproveProjectEnterprise } =
    useContext(PermissionsContext)

  const { status } = enterprise ?? {}
  const isPending = status === 'Pending Approval'

  const {
    overview,
    details,
    substance_details,
    substance_fields,
    funding_details,
    remarks,
  } = enterpriseData
  const disableSubmit = !(overview.name && overview.id)

  const editEnterprise = async () => {
    setIsLoading(true)
    setErrors({})
    setOtherErrors('')

    try {
      const data = {
        project: project_id,
        enterprise: omit(overview, ['status', 'linkStatus']),
        status: overview.linkStatus,
        ods_odp: substance_details,
        ...details,
        ...substance_fields,
        ...funding_details,
        ...remarks,
      }

      const result = await api(`api/project-enterprise/${enterprise_id}/`, {
        data: data,
        method: 'PUT',
      })

      setEnterpriseId(result.id)
      setEnterpriseName(result.enterprise.name)

      if (isPending && overview.linkStatus === 'Approved') {
        setLocation(
          `/projects-listing/projects-enterprises/${project_id}/view/${enterprise_id}`,
        )
      }
      return true
    } catch (error) {
      await handleErrors(error, setEnterpriseId, setErrors, setOtherErrors)

      return false
    } finally {
      setIsLoading(false)
    }
  }

  const onEditEnterprise = async () => {
    const wasEdited = await editEnterprise()

    if (wasEdited) {
      enqueueSnackbar(<>Project enterprise was updated successfully.</>, {
        variant: 'success',
      })
    }
  }

  const approveProjectEnterprise = async () => {
    const canChangeStatus = canEditProjectEnterprise
      ? await editEnterprise()
      : true

    if (canChangeStatus) {
      try {
        await api(`api/project-enterprise/${enterprise_id}/approve/`, {
          method: 'POST',
        })

        enqueueSnackbar(<>Project enterprise was approved successfully.</>, {
          variant: 'success',
        })
        setLocation(
          `/projects-listing/projects-enterprises/${project_id}/view/${enterprise_id}`,
        )
      } catch (error) {
        enqueueSnackbar(
          <>Could not approve project enterprise. Please try again.</>,
          {
            variant: 'error',
          },
        )
      }
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5">
      <CancelLinkButton
        title="Cancel"
        href={`/projects-listing/projects-enterprises/${project_id}`}
      />
      {canEditProjectEnterprise && (
        <Button
          className={cx('px-4 py-2 shadow-none', {
            [enabledButtonClassname]: !disableSubmit,
          })}
          onClick={onEditEnterprise}
          disabled={disableSubmit}
          variant="contained"
          size="large"
        >
          Update project enterprise
        </Button>
      )}
      {isPending && canApproveProjectEnterprise && (
        <Button
          className={cx({ [dropDownClassName]: !disableSubmit })}
          onClick={approveProjectEnterprise}
          disabled={disableSubmit}
          variant="contained"
          size="large"
        >
          Approve project enterprise
        </Button>
      )}
    </div>
  )
}

export default PEnterpriseEditActionButtons
