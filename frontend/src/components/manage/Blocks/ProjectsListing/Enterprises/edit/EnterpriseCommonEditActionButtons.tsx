import { useContext } from 'react'

import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ChangeStatusModal from './ChangeStatusModal'
import { DropDownButtonProps, DropDownMenuProps } from '../../HelperComponents'
import {
  dropDownClassName,
  dropdownItemClassname,
  enabledButtonClassname,
} from '../../constants'

import { Button, Divider } from '@mui/material'
import cx from 'classnames'

const EnterpriseCommonEditActionButtons = ({
  type,
  status,
  isObsoleteWarningOpen,
  setIsObsoleteWarningOpen,
  disableButton,
  handleEdit,
  handleChangeStatus,
}: {
  type: string
  status: string
  isObsoleteWarningOpen: boolean
  setIsObsoleteWarningOpen: (isOpen: boolean) => void
  disableButton: boolean
  handleEdit: () => Promise<boolean>
  handleChangeStatus: (status: string) => Promise<void>
}) => {
  const {
    canEditEnterprise,
    canEditProjectEnterprise,
    canApproveEnterprise,
    canApproveProjectEnterprise,
  } = useContext(PermissionsContext)

  const isEnterprise = type === 'enterprise'
  const extraText = !isEnterprise ? 'project' : ''
  const canEdit = isEnterprise ? canEditEnterprise : canEditProjectEnterprise
  const canApprove = isEnterprise
    ? canApproveEnterprise
    : canApproveProjectEnterprise

  const isPending = status === 'Pending Approval'
  const isApproved = status === 'Approved'
  const isObsolete = status === 'Obsolete'

  const handleChangeEnterpriseStatus = (status: string) => {
    if (status === 'Obsolete') {
      setIsObsoleteWarningOpen(true)
    } else {
      handleChangeStatus(status)
    }
  }

  return (
    <>
      {canEdit && isPending && (
        <Button
          className={cx('px-4 py-2 shadow-none', {
            [enabledButtonClassname]: !disableButton,
          })}
          onClick={handleEdit}
          disabled={disableButton}
          variant="contained"
          size="large"
        >
          Update {extraText} enterprise
        </Button>
      )}
      {canApprove &&
        !isObsolete &&
        (isApproved ? (
          <Button
            className={cx({ [dropDownClassName]: !disableButton })}
            onClick={() => handleChangeEnterpriseStatus('Obsolete')}
            disabled={disableButton}
            variant="contained"
            size="large"
          >
            Mark {extraText} enterprise as obsolete
          </Button>
        ) : (
          <Dropdown
            className={dropDownClassName}
            ButtonProps={DropDownButtonProps}
            MenuProps={DropDownMenuProps}
            label="Change status"
          >
            <Dropdown.Item
              disabled={disableButton}
              className={cx(dropdownItemClassname, 'text-primary')}
              onClick={() => handleChangeEnterpriseStatus('Approved')}
            >
              Approve {extraText} enterprise
            </Dropdown.Item>
            <Divider className="m-0" />
            <Dropdown.Item
              disabled={disableButton}
              className={cx(dropdownItemClassname, 'text-red-900')}
              onClick={() => handleChangeEnterpriseStatus('Obsolete')}
            >
              {isEnterprise
                ? 'Mark enterprise as obsolete'
                : 'Not approve project enterprise'}
            </Dropdown.Item>
          </Dropdown>
        ))}
      {isObsoleteWarningOpen && (
        <ChangeStatusModal
          {...{ type, status }}
          isModalOpen={isObsoleteWarningOpen}
          setIsModalOpen={setIsObsoleteWarningOpen}
          onAction={handleChangeStatus}
        />
      )}
    </>
  )
}

export default EnterpriseCommonEditActionButtons
