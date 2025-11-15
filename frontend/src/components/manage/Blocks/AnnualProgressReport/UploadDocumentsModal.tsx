import React, { Dispatch, FormEvent, SetStateAction } from 'react'
import { Box, IconButton, Link, Modal, Typography } from '@mui/material'
import { CancelButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents.tsx'
import Button from '@mui/material/Button'
import Cookies from 'js-cookie'
import { formatApiUrl } from '@ors/helpers'
import { enqueueSnackbar } from 'notistack'
import { IoTrash } from 'react-icons/io5'

interface APRFile {
  id: number
  file_name: string
  file_url: string
  file_type: 'annual_progress_financial_report' | 'other_supporting_document'
}

interface UploadDocumentsModalProps {
  isModalOpen: boolean
  setIsModalOpen: Dispatch<SetStateAction<boolean>>
  year: string | undefined
  agencyId: number
  oldFiles: APRFile[]
}

export default function UploadDocumentsModal({
  isModalOpen,
  setIsModalOpen,
  year,
  agencyId,
  oldFiles,
}: UploadDocumentsModalProps) {
  const formSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const csrftoken = Cookies.get('csrftoken')
    try {
      const response = await fetch(
        formatApiUrl(
          `api/annual-project-report/${year}/agency/${agencyId}/upload/`,
        ),
        {
          body: formData,
          credentials: 'include',
          headers: {
            ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
          },
          method: 'POST',
        },
      )

      if (!response.ok) {
        throw response
      }

      enqueueSnackbar(<>Files uploaded successfully</>, {
        variant: 'success',
      })
    } catch (e) {
      // TODO: better error reporting
      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    }
  }

  const financialFile = oldFiles.find(
    (file) => file.file_type === 'annual_progress_financial_report',
  )
  const supportingFiles = oldFiles.filter(
    (file) => file.file_type === 'other_supporting_document',
  )

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
            {financialFile && <File file={financialFile} />}
            {!financialFile && (
              <input
                name="financial_file"
                type="file"
                accept=".pdf,.doc,.docx"
              />
            )}
          </div>
          <div className="flex flex-col gap-y-2">
            <p className="m-0 text-lg font-medium">
              Other Supporting Documents
            </p>
            {supportingFiles.map((file) => (
              <File file={file} />
            ))}
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

function File({ file }: { file: APRFile }) {
  // TODO
  const deleteFile = async () => {
    // const csrftoken = Cookies.get('csrftoken')
    // try {
    //   const response = await fetch(
    //     formatApiUrl(
    //       `api/annual-project-report/${year}/agency/${agencyId}/upload/`,
    //     ),
    //     {
    //       credentials: 'include',
    //       headers: {
    //         ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
    //       },
    //       method: 'DELETE',
    //     },
    //   )
    //
    //   if (!response.ok) {
    //     throw response
    //   }
    //
    //   enqueueSnackbar(<>Files deleted successfully</>, {
    //     variant: 'success',
    //   })
    // } catch (e) {
    //   // TODO: better error reporting
    //   enqueueSnackbar(<>An error occurred. Please try again.</>, {
    //     variant: 'error',
    //   })
    // }
  }

  return (
    <div className="flex items-center gap-x-2">
      <IconButton size="small" aria-label="Delete" onClick={deleteFile}>
        <IoTrash />
      </IconButton>
      <Link href={formatApiUrl(file.file_url)}>{file.file_name}</Link>
    </div>
  )
}
