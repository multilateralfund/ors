import { useContext } from 'react'

import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { handleErrors } from '../../ProjectsEnterprises/FormHelperComponents'
import { EnterpriseActionButtons, EnterpriseOverview } from '../../interfaces'
import { enabledButtonClassname } from '../../constants'
import { api } from '@ors/helpers'

import { enqueueSnackbar } from 'notistack'
import { Button } from '@mui/material'
import { useParams } from 'wouter'
import cx from 'classnames'

const EnterpriseEditActionButtons = ({
  enterpriseData,
  setEnterpriseId,
  setEnterpriseName,
  setIsLoading,
  setErrors,
  setOtherErrors,
}: EnterpriseActionButtons & {
  enterpriseData: EnterpriseOverview
  setEnterpriseName: (name: string) => void
}) => {
  const { enterprise_id } = useParams<Record<string, string>>()
  const { clearUpdatedFields } = useUpdatedFields()

  const { canEditEnterprise } = useContext(PermissionsContext)

  const disabledButton = !enterpriseData.name

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
      clearUpdatedFields()

      enqueueSnackbar(<>Enterprise was updated successfully.</>, {
        variant: 'success',
      })
    } catch (error) {
      await handleErrors(error, setEnterpriseId, setErrors, setOtherErrors)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    canEditEnterprise && (
      <Button
        className={cx('px-4 py-2 shadow-none', {
          [enabledButtonClassname]: !disabledButton,
        })}
        onClick={editEnterprise}
        disabled={disabledButton}
        variant="contained"
        size="large"
      >
        Update enterprise
      </Button>
    )
  )
}

export default EnterpriseEditActionButtons
