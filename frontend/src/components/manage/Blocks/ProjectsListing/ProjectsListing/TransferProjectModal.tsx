import { useEffect, useMemo, useState } from 'react'

import CustomAlert from '@ors/components/theme/Alerts/CustomAlert'
import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import ProjectTransfer from './ProjectTransfer'
import { CancelButton } from '../HelperComponents'
import { useGetProject } from '../hooks/useGetProject'
import {
  FileMetaDataType,
  ProjectFilesObject,
  ProjectTransferData,
  ProjectTypeApi,
} from '../interfaces'
import {
  initialTranferedProjectData,
  requiredFieldsTransfer,
} from '../constants'
import {
  getFormattedDecimalValue,
  getNonFieldErrors,
  getTransferErrors,
} from '../utils'
import { formatApiUrl, uploadFiles } from '@ors/helpers'

import { Modal, Typography, Box, CircularProgress } from '@mui/material'
import { fromPairs, keys, map, values } from 'lodash'
import { enqueueSnackbar } from 'notistack'
import Cookies from 'js-cookie'

const ProjectTransferWrapper = ({
  project,
  setIsModalOpen,
}: {
  project: ProjectTypeApi
  setIsModalOpen: (isOpen: boolean) => void
}) => {
  const [projectData, setProjectData] = useState<ProjectTransferData>(
    initialTranferedProjectData,
  )
  const [files, setFiles] = useState<ProjectFilesObject>({
    deletedFilesIds: [],
    newFiles: [],
  })

  const [filesMetaData, setFilesMetaData] = useState<FileMetaDataType[]>([])
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [errors, setErrors] = useState<{ [key: string]: [] }>({})
  const [fileErrors, setFileErrors] = useState<string>('')
  const [otherErrors, setOtherErrors] = useState<string>('')

  const nonFieldsErrors = getNonFieldErrors(errors)

  const transferErrors = useMemo(
    () => getTransferErrors(projectData, project),
    [projectData],
  )
  const allFileErrors = [
    ...(fileErrors
      ? [
          {
            message: fileErrors,
          },
        ]
      : []),
    ...(files.newFiles?.length === 0
      ? [
          {
            message: `At least one file must be attached.`,
          },
        ]
      : []),
  ]

  const missingFileTypeErrors = map(filesMetaData, ({ type }, index) =>
    !type
      ? {
          id: index,
          message: `Attachment ${Number(index) + 1} - Type is required.`,
        }
      : null,
  ).filter(Boolean)

  const filteredErrors = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(errors).filter(([key]) =>
          requiredFieldsTransfer.includes(key),
        ),
      ),
    [errors],
  )
  const allTransferErrors = { ...transferErrors, ...filteredErrors }
  const disableTransfer = Object.values(transferErrors).some(
    (errors: any) => errors.length > 0,
  )

  useEffect(() => {
    setProjectData((prevData) => ({
      ...prevData,
      fund_transferred: getFormattedDecimalValue(project.total_fund),
      psc_transferred: getFormattedDecimalValue(project.support_cost_psc),
      psc_received: getFormattedDecimalValue(project.support_cost_psc),
    }))
  }, [])

  const handleErrors = async (error: any) => {
    const errors = await error.json()

    if (error.status === 400) {
      setErrors(errors)

      if (errors?.files) {
        setFileErrors(errors.files)
      }

      if (errors?.metadata) {
        setFileErrors(errors.metadata)
      }

      if (errors?.details) {
        setOtherErrors(errors.details)
      }
    }

    if (errors?.detail) {
      setOtherErrors(errors.detail)
    }

    enqueueSnackbar(<>An error occurred. Please try again.</>, {
      variant: 'error',
    })
  }

  const transferProject = async () => {
    setIsLoading(true)
    setFileErrors('')
    setOtherErrors('')
    setErrors({})

    const filesForUpload = files.newFiles ?? []
    const formattedFilesMetadata = fromPairs(
      map(filesMetaData, (file) => [file.name, file.type]),
    )
    const params = { metadata: JSON.stringify(formattedFilesMetadata) }

    try {
      const formData = new FormData()

      filesForUpload.forEach((file) => {
        formData.append('files', file)
      })
      formData.append(keys(params)[0], values(params)[0])

      if (filesForUpload.length > 0) {
        await uploadFiles(
          `/api/project/files/validate/`,
          filesForUpload,
          false,
          'list',
          params,
        )
      }

      Object.entries(projectData).forEach(([key, value]) => {
        formData.append(key, value)
      })

      const csrftoken = Cookies.get('csrftoken')

      await fetch(formatApiUrl(`/api/projects/v2/${project.id}/transfer`), {
        body: formData,
        credentials: 'include',
        headers: {
          ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
        },
        method: 'POST',
      })

      setIsModalOpen(false)
      enqueueSnackbar(<>Project was transferred successfully.</>, {
        variant: 'success',
      })
    } catch (error) {
      await handleErrors(error)
    } finally {
      setIsLoading(false)
      setHasSubmitted(true)
    }
  }

  return (
    <>
      <ProjectTransfer
        {...{
          projectData,
          setProjectData,
          filesMetaData,
          setFilesMetaData,
          project,
          files,
          setFiles,
          hasSubmitted,
          missingFileTypeErrors,
          allFileErrors,
        }}
        errors={allTransferErrors}
      />
      {(nonFieldsErrors.length > 0 || otherErrors) && (
        <CustomAlert
          type="error"
          alertClassName="BPAlert mt-4"
          content={
            <div className="mt-0.5 text-lg">
              {otherErrors}
              {map(nonFieldsErrors, (err, idx) => (
                <div key={idx}>{err}</div>
              ))}
            </div>
          }
        />
      )}
      <div className="ml-auto mr-6 mt-auto flex flex-wrap gap-3">
        <CustomLink
          className="h-10 px-4 py-2 text-lg uppercase"
          onClick={transferProject}
          disabled={disableTransfer}
          href={null}
          color="secondary"
          variant="contained"
          button
        >
          Transfer project
        </CustomLink>
        <CancelButton onClick={() => setIsModalOpen(false)} />
        {isLoading && (
          <CircularProgress
            color="inherit"
            size="30px"
            className="text-align mb-1 ml-1.5 mt-auto"
          />
        )}
      </div>
    </>
  )
}

const TransferProjectModal = ({
  id,
  isModalOpen,
  setIsModalOpen,
}: {
  id: number
  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void
}) => {
  const project = useGetProject(id.toString())
  const { data, loading } = project

  return (
    <Modal
      aria-labelledby="transfer-modal"
      open={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      keepMounted
    >
      <Box className="flex max-h-[90%] min-h-[250px] w-[80%] max-w-[1400px] flex-col rounded-2xl border-0 p-0 absolute-center 2xl:w-[60%]">
        <Typography className="mb-1 rounded-t-2xl bg-primary py-2 pl-6 text-3xl font-medium text-white">
          Transfer project {data?.code ?? data?.code_legacy}
        </Typography>
        <Loading
          className="!fixed bg-action-disabledBackground"
          active={loading}
        />
        <div className="flex flex-col overflow-y-auto px-6 py-3">
          {!loading && data && (
            <ProjectTransferWrapper project={data} {...{ setIsModalOpen }} />
          )}
        </div>
      </Box>
    </Modal>
  )
}

export default TransferProjectModal
