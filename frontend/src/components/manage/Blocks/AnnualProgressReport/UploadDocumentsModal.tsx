import React, { Dispatch, FormEvent, SetStateAction } from 'react'
import { Box, Modal, Typography } from '@mui/material'
import { CancelButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents.tsx'
import Button from '@mui/material/Button'

interface UploadDocumentsModalProps {
  isModalOpen: boolean
  setIsModalOpen: Dispatch<SetStateAction<boolean>>
}

export default function UploadDocumentsModal({
  isModalOpen,
  setIsModalOpen,
}: UploadDocumentsModalProps) {
  const formSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    console.log(formData.getAll('supporting_files'))
  }

  return (
    <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} keepMounted>
      <Box className="flex w-full max-w-lg flex-col px-0 absolute-center">
        <Typography className="mx-6 mb-4 mt-1 text-2xl font-medium">
          Upload documents
        </Typography>
        <form
          className="my-2 flex flex-col gap-y-6 bg-[#F5F5F5] px-6 py-2"
          method="POST"
          id="documents-modal-form"
          encType="multipart/form-data"
          onSubmit={formSubmit}
        >
          <div className="flex flex-col gap-y-2">
            <p className="m-0 text-lg font-medium">
              Upload Annual Progress & Financial Report
            </p>
            <input name="financial_file" type="file" />
          </div>
          <div className="flex flex-col gap-y-2">
            <p className="m-0 text-lg font-medium">
              Other Supporting Documents
            </p>
            <input name="supporting_files" type="file" multiple />
          </div>
        </form>
        <div className="ml-auto mr-6 flex gap-3">
          <Button variant="contained" type="submit" form="documents-modal-form">
            Save files
          </Button>
          <CancelButton onClick={() => setIsModalOpen(false)} />
        </div>
      </Box>
    </Modal>
  )
}
