'use client'

import { useContext, useEffect, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ProjectView from './ProjectView'
import {
  PageTitle,
  ProjectStatusInfo,
  RedirectBackButton,
  VersionsList,
  DropDownButtonProps,
  DropDownMenuProps,
  IncreaseVersionButton,
} from '../HelperComponents'
import { useGetProject } from '../hooks/useGetProject'
import { useGetProjectFiles } from '../hooks/useGetProjectFiles'
import { fetchSpecificFields } from '../hooks/getSpecificFields'
import { ProjectSpecificFields, RelatedProjectsType } from '../interfaces'
import { dropDownClassName, dropdownItemClassname } from '../constants'

import { Redirect, useLocation, useParams } from 'wouter'
import { CircularProgress, Divider } from '@mui/material'
import { filter, find, groupBy, isNull, replace } from 'lodash'
import cx from 'classnames'
import SubmitProjectModal from '../ProjectSubmission/SubmitProjectModal'
import SubmitTranchesWarningModal from '../ProjectSubmission/SubmitTranchesWarningModal'
import { api } from '@ors/helpers'
import { enqueueSnackbar } from 'notistack'
import ChangeStatusModal from '../ProjectSubmission/ChangeStatusModal'

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

const ProjectViewWrapper = () => {
  const { project_id, version: paramsVersion } =
    useParams<Record<string, string>>()
  const [location, setLocation] = useLocation()

  const {
    canEditProjects,
    canUpdatePostExcom,
    canSubmitProjects,
    canRecommendProjects,
    canApproveProjects,
  } = useContext(PermissionsContext)

  const project = useGetProject(project_id)
  const { data, loading } = project
  const {
    id,
    cluster_id,
    project_type_id,
    sector_id,
    submission_status,
    status: project_status,
    latest_project,
    version,
    editable,
    tranche = 0,
  } = data || {}

  const isDraft = submission_status === 'Draft'
  const isSubmitted = submission_status === 'Submitted'
  const isRecommended = submission_status === 'Recommended'

  const { files: projectFiles, loadedFiles } = useGetProjectFiles(
    parseInt(project_id),
  )

  const [specificFields, setSpecificFields] = useState<ProjectSpecificFields[]>(
    [],
  )
  const [specificFieldsLoaded, setSpecificFieldsLoaded] =
    useState<boolean>(false)
  const [showVersionsMenu, setShowVersionsMenu] = useState<boolean>(false)
  const [isTrancheWarningOpen, setIsTrancheWarningOpen] = useState(false)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [isSendToDraftModalOpen, setIsSendToDraftModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setSpecificFieldsLoaded(false)

    if (cluster_id && project_type_id && sector_id) {
      fetchSpecificFields(
        cluster_id,
        project_type_id,
        sector_id,
        setSpecificFields,
        project_id,
        setSpecificFieldsLoaded,
      )
    } else {
      setSpecificFields([])
      setSpecificFieldsLoaded(true)
    }
  }, [cluster_id, project_type_id, sector_id])

  const groupedFields = groupBy(specificFields, 'table')
  const projectFields = groupedFields['project'] || []

  const getTrancheErrors = async () => {
    try {
      const result = await api(
        `api/projects/v2/${project_id}/list_previous_tranches/?tranche=${tranche}&include_validation=true`,
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
      const hasTranchesWarning = await getTrancheErrors()

      if (hasTranchesWarning) {
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
      project.setParams((prev: any) => ({ ...prev }))
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
      project.setParams((prev: any) => ({ ...prev }))
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
      project.setParams((prev: any) => ({ ...prev }))
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

  if (project?.error) {
    return <Redirect to="/projects-listing/listing" />
  }

  if (
    data &&
    latest_project &&
    (!location.includes('archive') || paramsVersion != version)
  ) {
    return (
      <Redirect to={`/projects-listing/${project_id}/archive/${version}`} />
    )
  }

  if (data && !latest_project && location.includes('archive')) {
    return <Redirect to={`/projects-listing/${project_id}`} />
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && data && (
        <>
          <HeaderTitle>
            <div className="flex flex-wrap justify-between gap-3">
              <div className="flex flex-col">
                <RedirectBackButton />
                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <PageHeading>
                    <PageTitle
                      pageTitle="View project"
                      projectTitle={data.title}
                      project={data}
                    />
                  </PageHeading>
                  {project && (
                    <VersionsList
                      project={data}
                      {...{ showVersionsMenu, setShowVersionsMenu }}
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {canEditProjects && editable && isNull(latest_project) && (
                  <EditLink href={`/projects-listing/${project_id}/edit`}>
                    Edit
                  </EditLink>
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
                    href={`/projects-listing/${project_id}/approval`}
                  >
                    Approval
                  </EditLink>
                )}
                {canUpdatePostExcom &&
                isNull(latest_project) &&
                submission_status === 'Approved' &&
                project_status !== 'Closed' &&
                project_status !== 'Transferred' ? (
                  <EditLink
                    href={`/projects-listing/${project_id}/post-excom-update`}
                  >
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
              </div>
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
            <ProjectStatusInfo project={data} />
          </HeaderTitle>
          <ProjectView
            project={data}
            {...{
              projectFiles,
              specificFields,
              specificFieldsLoaded,
              loadedFiles,
            }}
          />
        </>
      )}
    </>
  )
}

export default ProjectViewWrapper
