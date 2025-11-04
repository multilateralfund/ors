import React, { Dispatch, SetStateAction } from 'react'
import { Box, Modal, Typography } from '@mui/material'
import { CancelButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents.tsx'

interface UploadDocumentsModalProps {
  isModalOpen: boolean
  setIsModalOpen: Dispatch<SetStateAction<boolean>>
}

export default function UploadDocumentsModal({
  isModalOpen,
  setIsModalOpen,
}: UploadDocumentsModalProps) {
  return (
    <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} keepMounted>
      <Box className="flex w-full max-w-lg flex-col px-0 absolute-center">
        <Typography className="mx-6 mb-4 mt-1 text-2xl font-medium">
          Upload documents
        </Typography>
        <div className="ml-auto mr-6 flex gap-3">
          <CancelButton onClick={() => setIsModalOpen(false)} />
        </div>
      </Box>
    </Modal>
  )
}
