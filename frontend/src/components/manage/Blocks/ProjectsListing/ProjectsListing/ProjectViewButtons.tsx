'use client'

import { useContext, useState } from 'react'

import CustomLink from '@ors/components/ui/Link/Link'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import EditActionModals from '../ProjectSubmission/EditActionModals'
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

import { filter, find, groupBy, isEmpty, isNull, replace } from 'lodash'
import { CircularProgress, Divider } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useLocation } from 'wouter'
import cx from 'classnames'

const EditLink = (props: any) => {
  const { children, className, ...rest } = props
  return (
    <CustomLink
      className={cx('mt-auto h-10 text-nowrap text-lg uppercase', className)}
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
  const [_, setLocation] = useLocation()

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
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false)

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

  const getIsProjectValid = async () => {
    try {
      const result = await api(
        `/api/projects/v2/${id}/list_associated_projects/?included_entries=only_project&include_validation=true&include_project=true`,
      )

      return result.every((project: RelatedProjectsType) =>
        isEmpty(project.errors),
      )
    } catch (error) {
      enqueueSnackbar(
        <>An error occurred during project validation. Please try again.</>,
        {
          variant: 'error',
        },
      )
      return false
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
      setIsLoading(true)
      const isProjectValid = await getIsProjectValid()

      if (isProjectValid) {
        setIsSubmitModalOpen(true)
      } else {
        setLocation(`/projects/${id}/edit`)
      }
    }
  }

  const onRecommendProject = async () => {
    setIsLoading(true)
    const isProjectValid = await getIsProjectValid()

    if (isProjectValid) {
      setIsRecommendModalOpen(true)
    } else {
      setLocation(`/projects/${id}/edit`)
    }
  }

  const sendProjectBackToDraft = async () => {
    setIsLoading(true)

    try {
      await api(`api/projects/v2/${id}/send_back_to_draft/`, {
        method: 'POST',
      })
      setParams((prev: any) => ({ ...prev }))
      enqueueSnackbar(<>Project(s) sent back to draft successfully.</>, {
        variant: 'success',
      })
    } catch (error) {
      enqueueSnackbar(
        <>
          Could not send project(s) back to draft. Please check project(s) data
          and try again.
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
      <div className="ml-auto flex flex-wrap justify-end gap-3">
        {editable && (
          <>
            {canEditProjects && (
              <EditLink href={`/projects/${id}/edit`}>Edit</EditLink>
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
                  onClick={onRecommendProject}
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
                href={`/projects/${id}/approval`}
              >
                Approval
              </EditLink>
            )}
          </>
        )}
        {canUpdatePostExcom &&
        getIsUpdatablePostExcom(submission_status, project_status) ? (
          <EditLink href={`/projects/${id}/post-excom-update`}>
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
        <EditActionModals
          {...{
            id,
            isSubmitModalOpen,
            setIsSubmitModalOpen,
            isRecommendModalOpen,
            setIsRecommendModalOpen,
            isWithdrawModalOpen,
            setIsWithdrawModalOpen,
            isSendToDraftModalOpen,
            setIsSendToDraftModalOpen,
            isTrancheWarningOpen,
            setIsTrancheWarningOpen,
            withdrawProject,
            sendProjectBackToDraft,
          }}
        />
      </div>
    )
  )
}

export default ProjectViewButtons
