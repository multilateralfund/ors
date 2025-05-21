'use client'

import { useEffect, useRef, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import Link from '@ors/components/ui/Link/Link'
import ProjectsCreate from '../ProjectsCreate/ProjectsCreate'
import {
  HeaderTag,
  VersionsDropdown,
} from '../ProjectVersions/ProjectVersionsComponents'
import { useGetProjectFiles } from '../hooks/useGetProjectFiles'
import { fetchSpecificFields } from '../hooks/getSpecificFields'
import {
  formatSubmitData,
  getDefaultValues,
  getIsSubmitDisabled,
} from '../utils'
import {
  OdsOdpFields,
  ProjectData,
  ProjectFilesObject,
  ProjectSpecificFields,
  ProjectTypeApi,
  SpecificFields,
} from '../interfaces'
import {
  initialCrossCuttingFields,
  initialProjectIdentifiers,
} from '../constants'
import { api, uploadFiles } from '@ors/helpers'

import { enqueueSnackbar } from 'notistack'
import { Button } from '@mui/material'
import { groupBy, map } from 'lodash'
import cx from 'classnames'

const ProjectsEdit = ({ project }: { project: ProjectTypeApi }) => {
  const project_id = project.id.toString()
  const { code, versions, version, latest_project } = project

  const [projectData, setProjectData] = useState<ProjectData>({
    projIdentifiers: initialProjectIdentifiers,
    bpLinking: { isLinkedToBP: false, bpId: null },
    crossCuttingFields: initialCrossCuttingFields,
    projectSpecificFields: {} as SpecificFields,
  })
  const [specificFields, setSpecificFields] = useState<ProjectSpecificFields[]>(
    [],
  )

  const { data: projectFiles } = useGetProjectFiles(project_id)
  const [files, setFiles] = useState<ProjectFilesObject>({
    deletedFilesIds: [],
    newFiles: [],
  })
  const { deletedFilesIds = [], newFiles = [] } = files || {}

  const [showVersionsMenu, setShowVersionsMenu] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const fieldsValuesLoaded = useRef<boolean>(false)

  const { projIdentifiers, crossCuttingFields } = projectData
  const { cluster } = projIdentifiers
  const { project_type, sector } = crossCuttingFields

  const groupedFields = groupBy(specificFields, 'table')
  const projectFields = groupedFields['project'] || []
  const odsOdpFields = groupedFields['ods_odp'] || []

  const isSubmitDisabled = getIsSubmitDisabled(
    projIdentifiers,
    crossCuttingFields,
  )

  const Versions = (
    <>
      <VersionsDropdown
        {...{ versions, showVersionsMenu, setShowVersionsMenu }}
      />
      <HeaderTag {...{ latest_project, version }} />
    </>
  )

  useEffect(() => {
    setProjectData((prevData) => ({
      ...prevData,
      projIdentifiers: {
        is_lead_agency: project.agency_id === project.lead_agency_id,
        country: project.country_id,
        meeting: project.meeting,
        current_agency: project.agency_id,
        side_agency:
          project.agency_id === project.lead_agency_id
            ? null
            : project.lead_agency_id,
        cluster: project.cluster_id,
      },
      bpLinking: {
        isLinkedToBP: !!project.bp_activity,
        bpId: project.bp_activity,
      },
      crossCuttingFields: {
        project_type: project.project_type_id,
        sector: project.sector_id,
        subsector_ids: map(project.subsectors, 'id'),
        is_lvc: project.is_lvc,
        title: project.title,
        description: project.description,
        project_start_date: project.project_start_date,
        project_end_date: project.project_end_date,
        total_fund: project.total_fund,
        support_cost_psc: project.support_cost_psc,
        individual_consideration: project.individual_consideration,
      },
    }))
  }, [])

  useEffect(() => {
    if (cluster && project_type && sector) {
      fetchSpecificFields(cluster, project_type, sector, setSpecificFields)
    } else setSpecificFields([])
  }, [cluster, project_type, sector])

  useEffect(() => {
    if (specificFields.length > 0 && !fieldsValuesLoaded.current) {
      setProjectData((prevData) => ({
        ...prevData,
        projectSpecificFields: {
          ...getDefaultValues<ProjectTypeApi>(projectFields, project),
          ods_odp: map(project.ods_odp, (ods) => {
            return { ...getDefaultValues<OdsOdpFields>(odsOdpFields, ods) }
          }),
        },
      }))

      fieldsValuesLoaded.current = true
    }
  }, [specificFields, fieldsValuesLoaded])

  const editProject = async () => {
    setIsSaving(true)

    try {
      if (newFiles.length > 0) {
        await uploadFiles(
          `/api/project/${project_id}/files/v2/`,
          newFiles,
          false,
          'list',
        )
      }

      if (deletedFilesIds.length > 0) {
        await api(`/api/project/${project_id}/files/v2`, {
          data: {
            file_ids: deletedFilesIds,
          },
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'DELETE',
        })
      }

      enqueueSnackbar(<>Updated {code} successfully.</>, {
        variant: 'success',
      })
    } catch (error) {
      if (error.status === 400) {
        const errors = await error.json()
        if (errors?.files) {
          enqueueSnackbar(errors.files, {
            variant: 'error',
          })
        } else {
          enqueueSnackbar(<>An error occurred. Please try again.</>, {
            variant: 'error',
          })
        }
      }
    } finally {
      setIsSaving(false)
    }
  }

  const increaseVersion = async () => {
    setIsSaving(true)

    try {
      const data = formatSubmitData(projectData)

      await api(`api/projects/v2/${project_id}/increase_version/`, {
        data: data,
        method: 'POST',
      })
    } catch (error) {
      console.error('Could not increase version.')
    } finally {
      setIsSaving(false)
    }
  }

  const enabledButtonClassname =
    'border border-solid border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow'

  const actionButtons = (
    <div>
      <div className="container flex w-full justify-between gap-x-4 px-0">
        <Link
          className="border border-solid border-primary bg-white px-4 py-2 text-primary shadow-none hover:bg-primary hover:text-white"
          color="primary"
          href={`/projects-listing/${project_id}`}
          size="large"
          variant="contained"
          button
        >
          Cancel
        </Link>
        <Button
          className={cx('px-4 py-2 shadow-none', {
            [enabledButtonClassname]: !isSubmitDisabled,
          })}
          size="large"
          variant="contained"
          onClick={editProject}
          disabled={isSubmitDisabled}
        >
          Save
        </Button>
        <Button
          className={cx('px-4 py-2 shadow-none', {
            [enabledButtonClassname]: !isSubmitDisabled,
          })}
          size="large"
          variant="contained"
          onClick={increaseVersion}
          disabled={isSubmitDisabled}
        >
          Submit new version
        </Button>
        <Loading
          className="!fixed bg-action-disabledBackground"
          active={isSaving}
        />
      </div>
    </div>
  )

  return (
    <ProjectsCreate
      heading={`Edit ${code}`}
      versions={Versions}
      initialCurrentStep={1}
      {...{
        projectData,
        setProjectData,
        actionButtons,
        specificFields,
        project,
        files,
        setFiles,
        projectFiles,
      }}
    />
  )
}

export default ProjectsEdit
