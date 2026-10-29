import { useContext, useState } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { IncreaseVersionButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ChangeVersionModal from './ChangeVersionModal'

import { Button } from '@mui/material'
import cx from 'classnames'

const WorkflowButtons = ({
  editPCR,
  isSaveDisabled,
}: {
  editPCR?: (showSuccess?: boolean) => Promise<boolean>
  isSaveDisabled?: boolean
}) => {
  const { pcr } = useContext(PCRDataContext)
  const { status } = pcr.data ?? {}

  const [modalType, setModalType] = useState<string | null>(null)

  return (
    <>
      {(status === 'Draft' || status === 'Adjustments requested') && (
        <IncreaseVersionButton
          title="Submit PCR"
          onSubmit={() => {
            setModalType('submit')
          }}
          isDisabled={isSaveDisabled}
          className={cx({ 'border border-solid': isSaveDisabled })}
        />
      )}
      {status === 'Submitted' && (
        <>
          <IncreaseVersionButton
            title="Approve"
            onSubmit={() => {
              setModalType('approve')
            }}
            isDisabled={isSaveDisabled}
            className={cx({ 'border border-solid': isSaveDisabled })}
          />
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
        </>
      )}
      <ChangeVersionModal {...{ modalType, setModalType, editPCR }} />
    </>
  )
}

export default WorkflowButtons
