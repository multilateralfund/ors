import { useContext, useState } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import CancelWarningModal from './CancelWarningModal'
import { SubmitButton } from '../HelperComponents'
import { ActionButtons } from '../interfaces'
import { formatSubmitData, getNonFieldErrors } from '../utils'
import { api, uploadFiles } from '@ors/helpers'
import { useStore } from '@ors/store'

import { useLocation } from 'wouter'
import { enqueueSnackbar } from 'notistack'
import { fromPairs, map } from 'lodash'

const CreateActionButtons = ({
  PCRData,
  setPCRData,
  files,
  isSaveDisabled,
  setIsLoading,
  setErrors,
  setFileErrors,
  filesMetaData,
}: ActionButtons & { mode: string }) => {
  const [_, setLocation] = useLocation()
  const { setInlineMessage } = useStore((state) => state.inlineMessage)

  const { canEditPCR } = useContext(PermissionsContext)
  const { updatedFields, clearUpdatedFields } = useUpdatedFields()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const { newFiles = [] } = files || {}

  const onCancel = () => {
    if (updatedFields.size > 0) {
      setIsCancelModalOpen(true)
    } else {
      setLocation('/projects-listing/listing')
    }
  }

  const createPCR = async () => {
    setIsLoading(true)
    setFileErrors('')
    setErrors({})
    setInlineMessage(null)

    try {
      const data = formatSubmitData(PCRData, setPCRData)

      const formattedFilesMetadata = fromPairs(
        map(filesMetaData, (file) => [file.name, file.type]),
      )
      const params = { metadata: JSON.stringify(formattedFilesMetadata) }

      if (newFiles.length > 0) {
        await uploadFiles(
          `/api/project/files/validate/`,
          newFiles,
          false,
          'list',
          params,
        )
      }
      const result = await api(`api/projects/v2/`, {
        data,
        method: 'POST',
      })

      if (newFiles.length > 0) {
        await uploadFiles(
          `/api/projects/v2/${result.id}/project-files/`,
          newFiles,
          false,
          'list',
          params,
        )
      }
      clearUpdatedFields()
      enqueueSnackbar(<>PCR created successfully.</>, {
        variant: 'success',
      })
      setLocation(`/projects-listing/${result.id}/edit`)
    } catch (error) {
      let errors: any = {}

      if (error instanceof Response) {
        const contentType = error.headers.get('content-type') || ''

        if (contentType.includes('application/json')) {
          errors = await error.json()
        } else {
          if (error.status === 413) {
            setFileErrors(
              'Uploaded files are too large. Maximum file size allowed is 170MB.',
            )
          }
          enqueueSnackbar(<>An error occurred. Please try again.</>, {
            variant: 'error',
          })

          return
        }

        if (error.status === 400) {
          setErrors(errors)

          const nonFieldErrors = getNonFieldErrors(errors)
          if (nonFieldErrors.length > 0) {
            setInlineMessage({
              type: 'error',
              errorMessages: nonFieldErrors,
            })
          }

          if (errors?.files ?? errors?.file ?? errors?.metadata) {
            setFileErrors(
              [errors?.files, errors?.file, errors?.metadata]
                .filter(Boolean)
                .join('\n'),
            )
          }

          if (errors?.details) {
            setInlineMessage({
              type: 'error',
              message: errors.details,
            })
          }
        }
      }

      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5">
      <CancelLinkButton title="Cancel" href={null} onClick={onCancel} />
      {canEditPCR && (
        <SubmitButton
          title="Create PCR"
          isDisabled={isSaveDisabled}
          onSubmit={createPCR}
          className="!py-2"
        />
      )}
      {isCancelModalOpen && (
        <CancelWarningModal
          mode="project creation"
          isModalOpen={isCancelModalOpen}
          setIsModalOpen={setIsCancelModalOpen}
        />
      )}
    </div>
  )
}

export default CreateActionButtons
