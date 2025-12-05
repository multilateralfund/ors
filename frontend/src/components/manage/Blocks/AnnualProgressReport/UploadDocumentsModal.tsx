import React, { Dispatch, FormEvent, SetStateAction, useState } from 'react'
import { Alert, Box, IconButton, Link, Modal, Typography } from '@mui/material'
import { CancelButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents.tsx'
import Button from '@mui/material/Button'
import Cookies from 'js-cookie'
import { formatApiUrl } from '@ors/helpers'
import { enqueueSnackbar } from 'notistack'
import { IoInformationCircleOutline, IoTrash } from 'react-icons/io5'
import { api } from '@ors/helpers'
import { useConfirmation } from '@ors/contexts/AnnualProjectReport/APRContext.tsx'
import { APRFile } from '@ors/app/annual-project-report/types.ts'

interface UploadDocumentsModalProps {
  isModalOpen: boolean
  setIsModalOpen: Dispatch<SetStateAction<boolean>>
  year: string | undefined
  agencyId: number
  oldFiles: APRFile[]
  revalidateFiles: () => void
  disabled: boolean
}

export default function UploadDocumentsModal({
  isModalOpen,
  setIsModalOpen,
  year,
  agencyId,
  oldFiles,
  revalidateFiles,
  disabled,
}: UploadDocumentsModalProps) {
  const [error, setError] = useState('')
  const [fileState, setFileState] = useState({
    financialFileKey: 0,
    financialFileSelected: false,
    supportingFilesKey: 0,
    supportingFilesSelected: false,
  })

  const formSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    // Capture form, as event.currentTarget becomes null after the event finishes bubbling
    const form = event.currentTarget
    const formData = new FormData(form)

    const financialReport = formData.get('financial_file')
    if (!(financialReport instanceof File) || financialReport.size === 0) {
      formData.delete('financial_file')
    }

    const supportingFiles = formData.getAll('supporting_files')
    const validSupportingFiles = supportingFiles.filter(
      (file) => file instanceof File && file.size > 0,
    )
    formData.delete('supporting_files')
    validSupportingFiles.forEach((file) => {
      formData.append('supporting_files', file)
    })

    if (!financialReport && validSupportingFiles.length === 0) {
      setError('Please select at least one file.')
      return
    }

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

      form.reset()
      setFileState((prev) => ({
        ...prev,
        financialFileSelected: false,
        supportingFilesSelected: false,
      }))
      revalidateFiles()
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
            {financialFile && (
              <FileView
                disabled={disabled}
                file={financialFile}
                revalidateFiles={revalidateFiles}
                year={year}
                agencyId={agencyId}
              />
            )}
            {!financialFile && (
              <div className="flex items-center gap-x-2">
                {fileState.financialFileSelected && (
                  <IconButton
                    size="small"
                    aria-label="Clear"
                    onClick={() =>
                      setFileState((prev) => ({
                        ...prev,
                        financialFileKey: prev.financialFileKey + 1,
                        financialFileSelected: false,
                      }))
                    }
                  >
                    <IoTrash />
                  </IconButton>
                )}
                <input
                  disabled={disabled}
                  key={fileState.financialFileKey}
                  name="financial_file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) => {
                    setFileState((prev) => ({
                      ...prev,
                      financialFileSelected:
                        (event.target.files?.length ?? 0) > 0,
                    }))
                  }}
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-y-2">
            <p className="m-0 text-lg font-medium">
              Other Supporting Documents
            </p>
            {supportingFiles.map((file) => (
              <FileView
                disabled={disabled}
                key={file.id}
                file={file}
                revalidateFiles={revalidateFiles}
                year={year}
                agencyId={agencyId}
              />
            ))}
            <div className="flex items-center gap-x-2">
              {fileState.supportingFilesSelected && (
                <IconButton
                  size="small"
                  aria-label="Clear"
                  onClick={() =>
                    setFileState((prev) => ({
                      ...prev,
                      supportingFilesKey: prev.supportingFilesKey + 1,
                      supportingFilesSelected: false,
                    }))
                  }
                >
                  <IoTrash />
                </IconButton>
              )}
              <input
                disabled={disabled}
                key={fileState.supportingFilesKey}
                name="supporting_files"
                type="file"
                multiple
                onChange={(event) => {
                  setFileState((prev) => ({
                    ...prev,
                    supportingFilesSelected:
                      (event.target.files?.length ?? 0) > 0,
                  }))
                }}
              />
            </div>
          </div>
        </form>
        {error && (
          <Alert
            className="mb-2"
            icon={<IoInformationCircleOutline size={24} />}
            severity="error"
          >
            {error}
          </Alert>
        )}
        <div className="ml-auto mr-6 flex gap-3">
          <Button
            disabled={disabled}
            variant="contained"
            type="submit"
            form="documents-modal-form"
          >
            Save files
          </Button>
          <CancelButton onClick={() => setIsModalOpen(false)} />
        </div>
      </Box>
    </Modal>
  )
}

interface FileViewProps {
  file: APRFile
  revalidateFiles: () => void
  year: string | undefined
  agencyId: number
  disabled: boolean
}

function FileView({
  file,
  revalidateFiles,
  year,
  agencyId,
  disabled,
}: FileViewProps) {
  const confirm = useConfirmation()

  const deleteFile = async () => {
    try {
      const response = await confirm({
        title: 'File deletion',
        message: 'Are you sure you want to delete this file?',
      })

      if (!response) {
        return
      }

      await api(
        `api/annual-project-report/${year}/agency/${agencyId}/files/${file.id}/`,
        {
          method: 'DELETE',
        },
      )

      revalidateFiles()
      enqueueSnackbar(<>Deleted file.</>, {
        variant: 'success',
      })
    } catch (e) {
      // TODO: better error reporting
      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    }
  }

  return (
    <div className="flex items-center gap-x-2">
      <IconButton
        disabled={disabled}
        size="small"
        aria-label="Delete"
        onClick={deleteFile}
      >
        <IoTrash />
      </IconButton>
      <Link href={formatApiUrl(file.file_url)}>{file.file_name}</Link>
    </div>
  )
}
