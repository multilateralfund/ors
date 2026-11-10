import { useContext, useState } from 'react'

import { IncreaseVersionButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import ChangeVersionModal from './ChangeVersionModal'
import { isSubmitPCRDisabled } from '../utils'

import { Button } from '@mui/material'
import cx from 'classnames'

const WorkflowButtons = ({
  editPCR,
  isSaveDisabled,
}: {
  editPCR?: (showSuccess?: boolean) => Promise<boolean>
  isSaveDisabled?: boolean
}) => {
  const { canSubmitPCR, canApprovePCR, canRequestAdjustmentsPCR } =
  useContext(PermissionsContext)
  const { pcr, errors } = useContext(PCRDataContext)
  const { status } = pcr.data ?? {}

  const isSubmitDisabled = isSaveDisabled || isSubmitPCRDisabled(errors)

  const [modalType, setModalType] = useState<string | null>(null)

  return (
    <>
      {canSubmitPCR &&
        (status === 'Draft' ||
          status === 'Revision (adjustments requested)') && (
          <IncreaseVersionButton
            title="Submit PCR"
            onSubmit={() => {
              setModalType('submit')
            }}
            isDisabled={isSubmitDisabled}
            className={cx({ 'border border-solid': isSubmitDisabled })}
          />
        )}
      {canApprovePCR && status === 'Revision' && (
        <IncreaseVersionButton
          title="Approve"
          onSubmit={() => {
            setModalType('approve')
          }}
          isDisabled={isSubmitDisabled}
          className={cx({ 'border border-solid': isSubmitDisabled })}
        />
      )}
      {canRequestAdjustmentsPCR && status === 'Revision' && (
        <Button
          className={cx('border border-solid px-4 py-2', {
            'border-red-900 bg-white text-red-900': !isSaveDisabled,
          })}
          size="large"
          variant="outlined"
          onClick={() => {
            setModalType('request changes')
          }}
          disabled={isSaveDisabled}
        >
          Request changes
        </Button>
      )}
      <ChangeVersionModal {...{ modalType, setModalType, editPCR }} />
    </>
  )
}

export default WorkflowButtons
