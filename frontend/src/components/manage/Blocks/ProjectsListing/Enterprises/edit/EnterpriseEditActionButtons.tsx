import { useContext, useState } from 'react'

import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { DropDownButtonProps, DropDownMenuProps } from '../../HelperComponents'
import { handleErrors } from '../../ProjectsEnterprises/FormHelperComponents'
import ChangeStatusModal from './ChangeStatusModal'
import {
  dropDownClassName,
  dropdownItemClassname,
  enabledButtonClassname,
} from '../../constants'
import {
  EnterpriseActionButtons,
  EnterpriseOverview,
  EnterpriseType,
} from '../../interfaces'
import { api } from '@ors/helpers'

import { useLocation, useParams } from 'wouter'
import { Button, Divider } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import cx from 'classnames'

const EnterpriseEditActionButtons = ({
  enterpriseData,
  enterprise,
  setEnterpriseId,
  setEnterpriseName,
  setIsLoading,
  setErrors,
  setOtherErrors,
}: EnterpriseActionButtons & {
  enterpriseData: EnterpriseOverview
  enterprise?: EnterpriseType
  setEnterpriseName: (name: string) => void
}) => {
  const { enterprise_id } = useParams<Record<string, string>>()
  const [_, setLocation] = useLocation()
  const { clearUpdatedFields } = useUpdatedFields()

  const { canEditEnterprise, canApproveEnterprise } =
    useContext(PermissionsContext)

  const [isObsoleteWarningOpen, setIsObsoleteWarningOpen] = useState(false)

  const { status = '' } = enterprise ?? {}
  const isApproved = status === 'Approved'
  const isObsolete = status === 'Obsolete'

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
      enqueueSnackbar(<>Enterprise was updated successfully.</>, {
        variant: 'success',
      })
    }
  }

  const handleChangeEnterpriseStatus = (status: string) => {
    if (status === 'Obsolete') {
      setIsObsoleteWarningOpen(true)
    } else {
      changeEnterpriseStatus(status)
    }
  }

  const changeEnterpriseStatus = async (status: string) => {
    const canChangeStatus =
      !isObsolete && canEditEnterprise ? await editEnterprise() : true

    if (canChangeStatus) {
      try {
        await api(`api/enterprises/${enterprise_id}/change_status/`, {
          data: { status },
          method: 'POST',
        })

        const successMessage =
          status === 'Approved' ? 'approved' : 'marked as obsolete'
        enqueueSnackbar(<>Enterprise was {successMessage} successfully.</>, {
          variant: 'success',
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
    <>
      <>
        {canEditEnterprise && !isObsolete && (
          <Button
            className={cx('px-4 py-2 shadow-none', {
              [enabledButtonClassname]: !disabledButton,
            })}
            onClick={onEditEnterprise}
            disabled={disabledButton}
            variant="contained"
            size="large"
          >
            Update enterprise
          </Button>
        )}
        {canApproveEnterprise &&
          !isObsolete &&
          (isApproved ? (
            <Button
              className={cx({ [dropDownClassName]: !disabledButton })}
              onClick={() => handleChangeEnterpriseStatus('Obsolete')}
              disabled={disabledButton}
              variant="contained"
              size="large"
            >
              Mark enterprise as obsolete
            </Button>
          ) : (
            <Dropdown
              className={dropDownClassName}
              ButtonProps={DropDownButtonProps}
              MenuProps={DropDownMenuProps}
              label="Change status"
            >
              <Dropdown.Item
                disabled={disabledButton}
                className={cx(dropdownItemClassname, 'text-primary')}
                onClick={() => handleChangeEnterpriseStatus('Approved')}
              >
                Approve enterprise
              </Dropdown.Item>
              <Divider className="m-0" />
              <Dropdown.Item
                disabled={disabledButton}
                className={cx(dropdownItemClassname, 'text-red-900')}
                onClick={() => handleChangeEnterpriseStatus('Obsolete')}
              >
                Mark enterprise as obsolete
              </Dropdown.Item>
            </Dropdown>
          ))}
      </>
      {isObsoleteWarningOpen && (
        <ChangeStatusModal
          isModalOpen={isObsoleteWarningOpen}
          setIsModalOpen={setIsObsoleteWarningOpen}
          onAction={changeEnterpriseStatus}
        />
      )}
    </>
  )
}

export default EnterpriseEditActionButtons
