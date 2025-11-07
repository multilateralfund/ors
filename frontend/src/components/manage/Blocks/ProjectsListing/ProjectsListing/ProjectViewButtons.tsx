'use client'

import { useContext, useState } from 'react'

import CustomLink from '@ors/components/ui/Link/Link'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import SubmitProjectModal from '../ProjectSubmission/SubmitProjectModal'
import SubmitTranchesWarningModal from '../ProjectSubmission/SubmitTranchesWarningModal'
import ChangeStatusModal from '../ProjectSubmission/ChangeStatusModal'
import {
  DropDownButtonProps,
  DropDownMenuProps,
  IncreaseVersionButton,
} from '../HelperComponents'
import { dropDownClassName, dropdownItemClassname } from '../constants'
import { getIsUpdatablePostExcom } from '../utils'
import {
  ProjectSpecificFields,
  ProjectTypeApi,
  RelatedProjectsType,
} from '../interfaces'
import { api } from '@ors/helpers'

import { filter, find, groupBy, isNull, replace } from 'lodash'
import { CircularProgress, Divider } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import cx from 'classnames'

const EditLink = (props: any) => {
  const { children, className, ...rest } = props
  return (
    <CustomLink
      className={cx(
        'ml-auto mt-auto h-10 text-nowrap text-lg uppercase',
        className,
      )}
      color="secondary"
      variant="contained"
      {...rest}
      button
    >
      {children}
    </CustomLink>
  )
}

const ProjectViewButtons = ({
  data,
  specificFields,
  setParams,
}: {
  data: ProjectTypeApi
  specificFields: ProjectSpecificFields[]
  setParams: any
}) => {
  const {
    canEditProjects,
    canSubmitProjects,
    canRecommendProjects,
    canApproveProjects,
    canUpdatePostExcom,
  } = useContext(PermissionsContext)

  const {
    id,
    submission_status,
    status: project_status,
    latest_project,
    editable,
    tranche = 0,
  } = data

  const isDraft = submission_status === 'Draft'
  const isSubmitted = submission_status === 'Submitted'
  const isRecommended = submission_status === 'Recommended'

  const [isLoading, setIsLoading] = useState(false)
  const [isTrancheWarningOpen, setIsTrancheWarningOpen] = useState(false)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [isSendToDraftModalOpen, setIsSendToDraftModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)

  const groupedFields = groupBy(specificFields, 'table')
  const projectFields = groupedFields['project'] || []

  const getTrancheWarnings = async () => {
    try {
      const result = await api(
        `api/projects/v2/${id}/list_previous_tranches/?tranche=${tranche}&include_validation=true`,
        {
          withStoreCache: false,
        },
        false,
      )

      if (result.length > 0) {
        const tranches = result.map((entry: RelatedProjectsType) =>
          filter(entry.warnings, (warning) => {
            const crtField = find(
              projectFields,
              (field) =>
                field.write_field_name ===
                replace(warning.field, /_?actual_?/g, ''),
            )

            return crtField && crtField.data_type !== 'boolean'
          }),
        )
        return tranches?.find(
          (tranche: RelatedProjectsType) => tranche?.warnings?.length > 0,
        )
      }
    } catch (error) {
      enqueueSnackbar(
        <>An error occurred during validations. Please try again.</>,
        {
          variant: 'error',
        },
      )
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitProject = async () => {
    if (tranche > 1) {
      setIsLoading(true)
      const tranchesWarnings = await getTrancheWarnings()

      if (tranchesWarnings) {
        setIsTrancheWarningOpen(true)
      } else {
        setIsSubmitModalOpen(true)
      }
    } else {
      setIsSubmitModalOpen(true)
    }
  }

  const recommendProject = async () => {
    setIsLoading(true)

    try {
      await api(`api/projects/v2/${id}/recommend/`, {
        method: 'POST',
      })
      setParams((prev: any) => ({ ...prev }))
    } catch (error) {
      enqueueSnackbar(
        <>
          Could not recommend project. Please check project's data and try
          again.
        </>,
        {
          variant: 'error',
        },
      )
    } finally {
      setIsLoading(false)
    }
  }

  const sendProjectBackToDraft = async () => {
    setIsLoading(true)

    try {
      await api(`api/projects/v2/${id}/send_back_to_draft/`, {
        method: 'POST',
      })
      setParams((prev: any) => ({ ...prev }))
    } catch (error) {
      enqueueSnackbar(
        <>
          Could not send project back to draft. Please check project's data and
          try again.
        </>,
        {
          variant: 'error',
        },
      )
    } finally {
      setIsLoading(false)
      setIsSendToDraftModalOpen(false)
    }
  }

  const withdrawProject = async () => {
    setIsLoading(true)

    try {
      await api(`api/projects/v2/${id}/withdraw/`, {
        method: 'POST',
      })
      setParams((prev: any) => ({ ...prev }))
    } catch (error) {
      enqueueSnackbar(
        <>
          Could not withdraw project. Please check project's data and try again.
        </>,
        {
          variant: 'error',
        },
      )
    } finally {
      setIsLoading(false)
      setIsWithdrawModalOpen(false)
    }
  }

  const onSendBackToDraftProject = () => {
    setIsSendToDraftModalOpen(true)
  }

  const onWithdrawProject = () => {
    setIsWithdrawModalOpen(true)
  }

  return (
    isNull(latest_project) && (
      <div className="flex flex-wrap gap-3">
        {editable && (
          <>
            {canEditProjects && (
              <EditLink href={`/projects-listing/${id}/edit`}>Edit</EditLink>
            )}
            {canSubmitProjects && isDraft && (
              <IncreaseVersionButton
                title="Submit project"
                onSubmit={onSubmitProject}
                className="mt-auto h-10"
              />
            )}
            {canRecommendProjects && isSubmitted && (
              <Dropdown
                className={cx(dropDownClassName, 'mt-auto h-10')}
                ButtonProps={DropDownButtonProps}
                MenuProps={DropDownMenuProps}
                label={<>Approval</>}
              >
                <Dropdown.Item
                  className={cx(dropdownItemClassname, 'text-primary')}
                  onClick={recommendProject}
                >
                  Recommend project
                </Dropdown.Item>
                <Divider className="m-0" />
                <Dropdown.Item
                  className={cx(dropdownItemClassname, 'text-red-900')}
                  onClick={onSendBackToDraftProject}
                >
                  Send project back to draft
                </Dropdown.Item>
                <Divider className="m-0" />
                <Dropdown.Item
                  className={cx(dropdownItemClassname, 'text-red-900')}
                  onClick={onWithdrawProject}
                >
                  Withdraw project
                </Dropdown.Item>
              </Dropdown>
            )}
            {canApproveProjects && isRecommended && (
              <EditLink
                className="bg-primary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow"
                href={`/projects-listing/${id}/approval`}
              >
                Approval
              </EditLink>
            )}
          </>
        )}
        {canUpdatePostExcom &&
        getIsUpdatablePostExcom(submission_status, project_status) ? (
          <EditLink href={`/projects-listing/${id}/post-excom-update`}>
            Update post ExCom
          </EditLink>
        ) : null}
        {isLoading && (
          <CircularProgress
            color="inherit"
            size="30px"
            className="text-align mb-1 ml-1.5 mt-auto"
          />
        )}
        {isSubmitModalOpen && (
          <SubmitProjectModal
            id={id}
            isModalOpen={isSubmitModalOpen}
            setIsModalOpen={setIsSubmitModalOpen}
          />
        )}
        {isWithdrawModalOpen && (
          <ChangeStatusModal
            mode="withdraw"
            isModalOpen={isWithdrawModalOpen}
            setIsModalOpen={setIsWithdrawModalOpen}
            onAction={withdrawProject}
          />
        )}
        {isSendToDraftModalOpen && (
          <ChangeStatusModal
            mode="sendToDraft"
            isModalOpen={isSendToDraftModalOpen}
            setIsModalOpen={setIsSendToDraftModalOpen}
            onAction={sendProjectBackToDraft}
          />
        )}
        {isTrancheWarningOpen && (
          <SubmitTranchesWarningModal
            {...{
              isTrancheWarningOpen,
              setIsTrancheWarningOpen,
              setIsSubmitModalOpen,
            }}
          />
        )}
      </div>
    )
  )
}

export default ProjectViewButtons
