import { useContext, useMemo, useState } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import Link from '@ors/components/ui/Link/Link'
import { IncreaseVersionButton } from '../HelperComponents'
import {
  checkInvalidValue,
  formatSubmitData,
  getCrossCuttingErrors,
  getHasNoFiles,
  getSpecificFieldsErrors,
  hasSectionErrors,
} from '../utils'
import { ProjectFile, ProjectTypeApi, SubmitActionButtons } from '../interfaces'
import { api, uploadFiles } from '@ors/helpers'
import { useStore } from '@ors/store'

import { Button, Modal, Typography, Box } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useLocation } from 'wouter'
import { lowerCase } from 'lodash'
import cx from 'classnames'

const EditActionButtons = ({
  projectData,
  project,
  files,
  projectFiles,
  setProjectId,
  setProjectTitle,
  isSaveDisabled,
  isSubmitDisabled,
  setIsLoading,
  setHasSubmitted,
  setFileErrors,
  setOtherErrors,
  setErrors,
  setProjectFiles,
  specificFields,
}: SubmitActionButtons & {
  setProjectTitle: (title: string) => void
  project: ProjectTypeApi
  isSubmitDisabled: boolean
  projectFiles?: ProjectFile[]
  setProjectFiles: (value: ProjectFile[]) => void
}) => {
  const [_, setLocation] = useLocation()

  const { id, version, submission_status } = project

  const commonSlice = useStore((state) => state.common)
  const user_permissions = commonSlice.user_permissions.data || []

  const { canUpdateProjects, canSubmitProjects, canRecommendProjects } =
    useContext(PermissionsContext)

  const [isModalOpen, setIsModalOpen] = useState(false)

  const { crossCuttingFields, projectSpecificFields } = projectData
  const odsOdpData = projectSpecificFields?.ods_odp ?? []

  const crossCuttingErrors = useMemo(
    () => getCrossCuttingErrors(crossCuttingFields, {}, 'edit'),
    [crossCuttingFields],
  )
  const specificErrors = useMemo(
    () =>
      getSpecificFieldsErrors(
        projectSpecificFields,
        specificFields,
        {},
        'edit',
      ),
    [projectSpecificFields],
  )

  const hasOdsOdpErrors =
    odsOdpData.some((data) => Object.values(data).some(checkInvalidValue)) ||
    odsOdpData.length === 0
  const impactErrors = specificErrors['Impact'] || {}

  const hasErrors =
    hasSectionErrors(crossCuttingErrors) ||
    hasSectionErrors(impactErrors) ||
    hasOdsOdpErrors ||
    getHasNoFiles(files, projectFiles)
  const disableSubmit = isSubmitDisabled || hasErrors

  const { deletedFilesIds = [], newFiles = [] } = files || {}

  const handleErrors = async (error: any) => {
    const errors = await error.json()

    if (error.status === 400) {
      setErrors(errors)

      if (errors?.files) {
        setFileErrors(errors.files)
      }

      if (errors?.details) {
        setOtherErrors(errors.details)
      }
    }

    setProjectId(null)
    enqueueSnackbar(<>An error occurred. Please try again.</>, {
      variant: 'error',
    })
  }

  const editProject = async () => {
    setIsLoading(true)
    setFileErrors('')
    setOtherErrors('')
    setErrors({})

    try {
      if (newFiles.length > 0) {
        await uploadFiles(
          `/api/project/${id}/files/v2/`,
          newFiles,
          false,
          'list',
        )
      }

      if (deletedFilesIds.length > 0) {
        await api(`/api/project/${id}/files/v2`, {
          data: {
            file_ids: deletedFilesIds,
          },
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'DELETE',
        })
      }

      const res = await api(
        `/api/project/${id}/files/v2/`,
        {
          withStoreCache: false,
        },
        false,
      )
      setProjectFiles(res)

      const data = formatSubmitData(projectData, specificFields)

      const result = await api(`api/projects/v2/${id}`, {
        data: data,
        method: 'PUT',
      })
      setProjectId(result.id)
      setProjectTitle(result.title)
    } catch (error) {
      await handleErrors(error)
    } finally {
      setIsLoading(false)
    }
  }

  const submitProject = async () => {
    await editProject()
    try {
      await api(`api/projects/v2/${id}/submit`, {
        method: 'POST',
      })
      setLocation(`/projects-listing/${id}`)
    } catch (error) {
      await handleErrors(error)
    } finally {
      setIsLoading(false)
      setHasSubmitted(true)
    }
  }

  const recommendProject = async () => {
    await editProject()
    try {
      await api(`api/projects/v2/${id}/recommend`, {
        method: 'POST',
      })
      setLocation(`/projects-listing/${id}`)
    } catch (error) {
      await handleErrors(error)
    } finally {
      setIsLoading(false)
      setHasSubmitted(true)
    }
  }

  const withdrawProject = async () => {
    try {
      await api(`api/projects/v2/${id}/withdraw`, {
        method: 'POST',
      })
      setLocation(`/projects-listing/${id}`)
    } catch (error) {
      enqueueSnackbar(<>Could not withdraw project. Please try again.</>, {
        variant: 'error',
      })
    }
  }

  const enabledButtonClassname =
    'border border-solid border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow'

  return (
    <div className="container flex w-full flex-wrap gap-x-3 gap-y-2 px-0">
      <Link
        className="border border-solid border-primary bg-white px-4 py-2 text-primary shadow-none hover:bg-primary hover:text-white"
        color="primary"
        href={`/projects-listing/${id}`}
        size="large"
        variant="contained"
        button
      >
        Close
      </Link>
      {canUpdateProjects && (
        <Button
          className={cx('px-4 py-2 shadow-none', {
            [enabledButtonClassname]: !isSaveDisabled,
          })}
          size="large"
          variant="contained"
          onClick={editProject}
          disabled={isSaveDisabled}
        >
          Update project
        </Button>
      )}
      {canUpdateProjects && (
        <Button
          className={cx('px-4 py-2 shadow-none', enabledButtonClassname)}
          size="large"
          variant="contained"
          onClick={() => setIsModalOpen(true)}
        >
          Add additional component
        </Button>
      )}
      {canSubmitProjects &&
        (version === 1 && lowerCase(submission_status) === 'draft' ? (
          <IncreaseVersionButton
            title="Submit project"
            onSubmit={submitProject}
            isDisabled={disableSubmit}
          />
        ) : version === 2 &&
          lowerCase(submission_status) === 'submitted' &&
          canRecommendProjects ? (
          <>
            <IncreaseVersionButton
              title="Recommend project"
              onSubmit={recommendProject}
              isDisabled={disableSubmit}
            />
            <IncreaseVersionButton
              title="Withdraw project"
              onSubmit={withdrawProject}
            />
          </>
        ) : null)}
      {isModalOpen && (
        <Modal
          aria-labelledby="add-component-modal-title"
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          keepMounted
        >
          <Box className="flex w-full max-w-lg flex-col absolute-center">
            <Typography className="mb-4 text-xl">
              Start from a copy of this project or from a blank submission?
            </Typography>
            <div className="ml-auto flex gap-1">
              <Link
                component="a"
                className="no-underline"
                target="_blank"
                rel="noopener noreferrer nofollow"
                href={`/projects-listing/create/${id}/full-copy/additional-component`}
              >
                <Button
                  className="text-base"
                  onClick={() => setIsModalOpen(false)}
                >
                  Copy of project
                </Button>
              </Link>

              <Link
                component="a"
                className="no-underline"
                target="_blank"
                rel="noopener noreferrer nofollow"
                href={`/projects-listing/create/${id}/partial-copy/additional-component`}
              >
                <Button
                  className="text-base"
                  onClick={() => setIsModalOpen(false)}
                >
                  Blank submission
                </Button>
              </Link>
              <Button
                className="text-base"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </Box>
        </Modal>
      )}
    </div>
  )
}

export default EditActionButtons
