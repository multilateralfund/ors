'use client'

import { useEffect, useRef, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import Link from '@ors/components/ui/Link/Link'
import ProjectsCreate from '../ProjectsCreate/ProjectsCreate'
import { useGetProject } from '../hooks/useGetProject'
import {
  CrossCuttingFields,
  OdsOdpFields,
  ProjectFilesObject,
  ProjectSpecificFields,
  ProjectTypeApi,
  ProjIdentifiers,
  SpecificFields,
} from '../interfaces'
import { fetchSpecificFields } from '../hooks/getSpecificFields'
import { api, uploadFiles } from '@ors/helpers'

import { enqueueSnackbar } from 'notistack'
import { Button } from '@mui/material'
import { useParams } from 'wouter'
import { groupBy, map } from 'lodash'
import { getDefaultValues } from '../utils'
import {
  initialCrossCuttingFields,
  initialProjectIdentifiers,
} from '../constants'

const ProjectsEditWrapper = () => {
  const { project_id } = useParams<Record<string, string>>()

  const projectApi = useGetProject(project_id)
  const { data: project, loading } = projectApi

  const [projectFiles, setProjectFiles] = useState([])
  const [files, setFiles] = useState<ProjectFilesObject>({
    deletedFilesIds: [],
    newFiles: [],
  })
  const { deletedFilesIds = [], newFiles = [] } = files || {}

  const [isSaving, setIsSaving] = useState(false)

  const [specificFields, setSpecificFields] = useState<ProjectSpecificFields[]>(
    [],
  )
  const [projIdentifiers, setProjIdentifiers] = useState<ProjIdentifiers>(
    initialProjectIdentifiers,
  )
  const [isLinkedToBP, setIsLinkedToBP] = useState<boolean>(false)
  const [bpId, setBpId] = useState<number | null>(null)
  const [crossCuttingFields, setCrossCuttingFields] =
    useState<CrossCuttingFields>(initialCrossCuttingFields)
  const [projectSpecificFields, setProjectSpecificFields] =
    useState<SpecificFields>()

  const groupedFields = groupBy(specificFields, 'table')
  const projectFields = groupedFields['project'] || []
  const odsOdpFields = groupedFields['ods_odp'] || []

  // const isSubmitDisabled =
  //   areNextSectionsDisabled ||
  //   !(projectType && sector && crossCuttingFields.title)

  const fieldsValuesLoaded = useRef<boolean>(false)

  const { cluster } = projIdentifiers
  const { project_type, sector } = crossCuttingFields

  useEffect(() => {
    if (cluster && project_type && sector) {
      fetchSpecificFields(cluster, project_type, sector, setSpecificFields)
    } else setSpecificFields([])
  }, [cluster, project_type, sector])

  useEffect(() => {
    if (project) {
      setProjIdentifiers({
        is_lead_agency: project.agency_id === project.lead_agency_id,
        country: project.country_id,
        meeting: project.meeting,
        current_agency: project.agency_id,
        side_agency:
          project.agency_id === project.lead_agency_id
            ? null
            : project.lead_agency_id,
        cluster: project.cluster_id,
      })
      setIsLinkedToBP(!!project.bp_activity)
      setBpId(project.bp_activity)
      setCrossCuttingFields({
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
      })
    }
  }, [])

  useEffect(() => {
    if (project && specificFields.length > 0 && !fieldsValuesLoaded.current) {
      setProjectSpecificFields({
        ...getDefaultValues<ProjectTypeApi>(projectFields, project),
        ods_odp: map(project.ods_odp, (ods) => {
          return { ...getDefaultValues<OdsOdpFields>(odsOdpFields, ods) }
        }),
      })
      fieldsValuesLoaded.current = true
    }
  }, [fieldsValuesLoaded, specificFields])

  const fetchProjectFiles = async () => {
    try {
      const res = await api(`/api/project/${project_id}/files/v2`)
      setProjectFiles(res || [])
      setFiles({ newFiles: [], deletedFilesIds: [] })
    } catch (e) {
      console.error('Error at loading project files')
    }
  }

  useEffect(() => {
    if (project_id) {
      fetchProjectFiles()
    }
  }, [project_id])

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

      setIsSaving(false)
      await fetchProjectFiles()
      enqueueSnackbar(<>Updated {project.code}.</>, {
        variant: 'success',
      })
    } catch (error) {
      setIsSaving(false)

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
    }
  }

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
          className="px-4 py-2 shadow-none hover:text-white"
          size="large"
          variant="contained"
          onClick={editProject}
        >
          Save
        </Button>
        <Loading
          className="!fixed bg-action-disabledBackground"
          active={isSaving}
        />
      </div>
    </div>
  )

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && project && (
        <ProjectsCreate
          heading={`Edit ${project.code}`}
          actionButtons={actionButtons}
          project={project}
          specificFields={specificFields}
          {...{
            files,
            setFiles,
            projectFiles,
            projectSpecificFields,
            setProjectSpecificFields,
            projIdentifiers,
            crossCuttingFields,
            setProjIdentifiers,
            setCrossCuttingFields,
            isLinkedToBP,
            setIsLinkedToBP,
            bpId,
            setBpId,
          }}
        />
      )}
    </>
  )
}

export default ProjectsEditWrapper
