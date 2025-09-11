import { useContext } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { EnterpriseActionButtons, EnterpriseOverview } from '../../interfaces'
import { enabledButtonClassname } from '../../constants'
import { api } from '@ors/helpers'

import { useLocation, useParams } from 'wouter'
import { enqueueSnackbar } from 'notistack'
import { Button } from '@mui/material'
import cx from 'classnames'

const EnterpriseEditActionButtons = ({
  enterpriseData,
  setEnterpriseId,
  setEnterpriseName,
  setIsLoading,
  setHasSubmitted,
  setOtherErrors,
  setErrors,
}: EnterpriseActionButtons & {
  enterpriseData: EnterpriseOverview
  setEnterpriseName: (name: string) => void
}) => {
  const { enterprise_id } = useParams<Record<string, string>>()
  const { canEditEnterprise, canApproveEnterprise } =
    useContext(PermissionsContext)
  const [_, setLocation] = useLocation()

  const disableSubmit = !enterpriseData.name

  const handleErrors = async (error: any) => {
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
  }

  const editEnterprise = async () => {
    setIsLoading(true)
    setOtherErrors('')
    setErrors({})

    try {
      const result = await api(`api/project-enterprise/${enterprise_id}/`, {
        data: enterpriseData,
        method: 'PUT',
      })

      setEnterpriseId(result.id)
      setEnterpriseName(result.enterprise.name)
    } catch (error) {
      await handleErrors(error)
    } finally {
      setIsLoading(false)
      setHasSubmitted(true)
    }
  }

  const approveEnterprise = async () => {
    try {
      await api(`api/project-enterprise/${enterprise_id}/approve/`, {
        method: 'POST',
      })

      setLocation(`/projects-listing/enterprises/${enterprise_id}`)
    } catch (error) {
      enqueueSnackbar(<>Could not approve enterprise. Please try again.</>, {
        variant: 'error',
      })
    }
  }

  return (
    <div className="container flex w-full flex-wrap gap-x-3 gap-y-2 px-0">
      <CancelLinkButton
        title="Cancel"
        href={`/projects-listing/enterprises/${enterprise_id}`}
      />
      {canEditEnterprise && (
        <Button
          className={cx('px-4 py-2 shadow-none', {
            [enabledButtonClassname]: !disableSubmit,
          })}
          onClick={editEnterprise}
          disabled={disableSubmit}
          variant="contained"
          size="large"
        >
          Update enterprise
        </Button>
      )}
      {canApproveEnterprise && (
        <Button
          className={cx('px-4 py-2 shadow-none', {
            [enabledButtonClassname]: !disableSubmit,
          })}
          onClick={approveEnterprise}
          disabled={disableSubmit}
          variant="contained"
          size="large"
        >
          Approve enterprise
        </Button>
      )}
    </div>
  )
}

export default EnterpriseEditActionButtons
