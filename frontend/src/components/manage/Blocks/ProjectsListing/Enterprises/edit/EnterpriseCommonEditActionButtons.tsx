import { useContext } from 'react'

import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import PermissionsContext from '@ors/contexts/PermissionsContext'
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
  disableButton,
  handleEdit,
  handleChangeStatus,
}: {
  type: string
  status: string
  disableButton: boolean
  handleEdit: () => Promise<boolean>
  handleChangeStatus: (status: string) => void
}) => {
  const { canEditEnterprise, canApproveEnterprise } =
    useContext(PermissionsContext)

  const isEnterprise = type === 'Enterprise'
  const isPending = status === 'Pending Approval'
  const isApproved = status === 'Approved'
  const isObsolete = status === 'Obsolete'

  return (
    <>
      {canEditEnterprise && isPending && (
        <Button
          className={cx('px-4 py-2 shadow-none', {
            [enabledButtonClassname]: !disableButton,
          })}
          onClick={handleEdit}
          disabled={disableButton}
          variant="contained"
          size="large"
        >
          Update {!isEnterprise ? 'project' : ''} enterprise
        </Button>
      )}
      {canApproveEnterprise &&
        !isObsolete &&
        (isApproved ? (
          <Button
            className={cx({ [dropDownClassName]: !disableButton })}
            onClick={() => handleChangeStatus('Obsolete')}
            disabled={disableButton}
            variant="contained"
            size="large"
          >
            Mark {!isEnterprise ? 'project' : ''} enterprise as obsolete
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
              onClick={() => handleChangeStatus('Approved')}
            >
              Approve {!isEnterprise ? 'project' : ''} enterprise
            </Dropdown.Item>
            <Divider className="m-0" />
            <Dropdown.Item
              disabled={disableButton}
              className={cx(dropdownItemClassname, 'text-red-900')}
              onClick={() => handleChangeStatus('Obsolete')}
            >
              {!isEnterprise
                ? 'Not approve project enterprise'
                : 'Mark enterprise as obsolete'}
            </Dropdown.Item>
          </Dropdown>
        ))}
    </>
  )
}

export default EnterpriseCommonEditActionButtons
