'use client'

import { useEffect, useRef, useState } from 'react'

import ProjectsHeader from '../ProjectSubmission/ProjectsHeader'
import ProjectsCreate from '../ProjectsCreate/ProjectsCreate'
import ProjectSubmissionFooter from '../ProjectSubmission/ProjectSubmissionFooter'
import { useGetProjectFiles } from '../hooks/useGetProjectFiles'
import { fetchSpecificFields } from '../hooks/getSpecificFields'
import {
  getDefaultValues,
  getFileFromMetadata,
  getNonFieldErrors,
} from '../utils'
import {
  OdsOdpFields,
  ProjectData,
  ProjectFile,
  ProjectFilesObject,
  ProjectSpecificFields,
  ProjectTypeApi,
  SpecificFields,
} from '../interfaces'
import {
  initialCrossCuttingFields,
  initialProjectIdentifiers,
} from '../constants'
import { useStore } from '@ors/store'

import { groupBy, map } from 'lodash'

const ProjectsEdit = ({
  project,
  mode,
}: {
  project: ProjectTypeApi
  mode: string
}) => {
  const project_id = project.id.toString()

  const userSlice = useStore((state) => state.user)
  const { agency_id } = userSlice.data

  const [projectData, setProjectData] = useState<ProjectData>({
    projIdentifiers: initialProjectIdentifiers,
    bpLinking: { isLinkedToBP: false, bpId: null },
    crossCuttingFields: initialCrossCuttingFields,
    projectSpecificFields: {} as SpecificFields,
  })
  const [specificFields, setSpecificFields] = useState<ProjectSpecificFields[]>(
    [],
  )

  const { projIdentifiers, crossCuttingFields } = projectData
  const { cluster } = projIdentifiers
  const { project_type, sector } = crossCuttingFields

  const groupedFields = groupBy(specificFields, 'table')
  const projectFields = groupedFields['project'] || []
  const odsOdpFields = groupedFields['ods_odp'] || []

  const fieldsValuesLoaded = useRef<boolean>(false)

  const { data } = useGetProjectFiles(project_id)

  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([])
  const [files, setFiles] = useState<ProjectFilesObject>({
    deletedFilesIds: [],
    newFiles: [],
  })

  useEffect(() => {
    setProjectFiles(data)

    if (mode !== 'edit' && data?.length > 0) {
      const loadFiles = async () => {
        const resolvedFiles = await Promise.all(
          data.map((file: ProjectFile) => getFileFromMetadata(file)),
        )

        setFiles((prev) => ({
          ...prev,
          newFiles: resolvedFiles,
        }))
      }

      loadFiles()
    }
  }, [data])

  useEffect(() => {
    if (mode === 'edit') {
      setFiles({
        deletedFilesIds: [],
        newFiles: [],
      })
    }
  }, [projectFiles])

  const [projectId, setProjectId] = useState<number | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false)

  const [errors, setErrors] = useState<{ [key: string]: [] }>({})
  const [fileErrors, setFileErrors] = useState<string>('')
  const [otherErrors, setOtherErrors] = useState<string>('')

  const nonFieldsErrors = getNonFieldErrors(errors)

  useEffect(() => {
    setProjectData((prevData) => ({
      ...prevData,
      projIdentifiers: {
        country: project.country_id,
        meeting: project.meeting_id,
        current_agency: agency_id ?? project.agency_id,
        side_agency:
          !agency_id || project.agency_id === agency_id
            ? null
            : project.agency_id,
        is_lead_agency: agency_id ? project.agency_id === agency_id : true,
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

  return (
    <>
      <ProjectsHeader
        {...{
          mode,
          project,
          projectData,
          files,
          setProjectId,
          setErrors,
          setHasSubmitted,
          setFileErrors,
          setOtherErrors,
          setProjectFiles,
          specificFields,
        }}
      />
      <ProjectsCreate
        {...{
          projectData,
          setProjectData,
          mode,
          specificFields,
          project,
          files,
          setFiles,
          projectFiles,
          errors,
          setErrors,
          hasSubmitted,
          fileErrors,
        }}
      />
      <ProjectSubmissionFooter
        successMessage={
          mode === 'edit'
            ? 'Updated project successfully.'
            : 'Submission was successful.'
        }
        {...{ projectId, nonFieldsErrors, otherErrors }}
      />
    </>
  )
}

export default ProjectsEdit
