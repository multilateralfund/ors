import { useContext, useState } from 'react'

import CustomLink from '@ors/components/ui/Link/Link'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { CancelButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { api } from '@ors/helpers'

import { Modal, Box, Typography, CircularProgress } from '@mui/material'
import { useLocation, useParams } from 'wouter'
import { enqueueSnackbar } from 'notistack'
import { capitalize } from 'lodash'

const ChangeVersionModal = ({
  modalType,
  setModalType,
  editPCR,
}: {
  modalType: string | null
  setModalType: (modalType: string | null) => void
  editPCR?: (showSuccess?: boolean) => Promise<boolean>
}) => {
  const { pcr_id, project_id } = useParams<Record<string, string>>()
  const [_, setLocation] = useLocation()

  const { pcr } = useContext(PCRDataContext)

  const [isProcessing, setIsProcessing] = useState(false)

  const modalTitle = modalType === 'submit' ? 'submit' : ''

  const submitPCR = async () => {
    try {
      await api(`api/project-completion-reports/${pcr_id}/submit/`, {
        method: 'POST',
      })
      pcr.refetch()
      setLocation(`/pcr/${project_id}/${pcr_id}`)
      enqueueSnackbar(<>PCR submitted successfully.</>, {
        variant: 'success',
      })
    } catch (error) {
      const data =
        error instanceof Response ? await error.json().catch(() => null) : null

      enqueueSnackbar(
        <>{data?.error ?? 'Could not submit PCR. Please try again.'}</>,
        {
          variant: 'error',
        },
      )
    }
  }

  const onAction = async () => {
    setIsProcessing(true)

    const isSaved = editPCR ? await editPCR(false) : true

    if (isSaved) {
      if (modalType === 'submit') {
        await submitPCR()
      }
    }

    setIsProcessing(false)
    setModalType(null)
  }

  const onClose = () => {
    if (!isProcessing) {
      setModalType(null)
    }
  }

  return (
    <Modal
      aria-labelledby="change-version-modal"
      open={!!modalType}
      onClose={onClose}
    >
      <Box className="flex w-full max-w-[90%] flex-col px-0 absolute-center md:max-w-2xl">
        <Typography className="mx-6 mb-4 mt-1 text-2xl font-medium">
          {capitalize(modalTitle)} PCR
        </Typography>
        <div className="mb-4 bg-common-containerBg p-6 text-lg">
          Are you sure you want to {modalTitle} this PCR?
        </div>
        <div className="mr-6 flex flex-wrap justify-end gap-3">
          <CustomLink
            className="h-10 px-4 py-2 text-lg uppercase"
            onClick={onAction}
            disabled={isProcessing}
            href={null}
            color="secondary"
            variant="contained"
            button
          >
            {modalTitle} PCR
          </CustomLink>
          <CancelButton onClick={onClose} />
          {isProcessing && (
            <CircularProgress
              className="mb-1 ml-1.5 mt-auto"
              color="inherit"
              size="30px"
            />
          )}
        </div>
      </Box>
    </Modal>
  )
}

export default ChangeVersionModal
