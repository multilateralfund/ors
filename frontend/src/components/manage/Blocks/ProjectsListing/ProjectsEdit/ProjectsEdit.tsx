'use client'

import { useEffect, useRef, useState } from 'react'

import ProjectsHeader from '../ProjectSubmission/ProjectsHeader'
import ProjectsCreate from '../ProjectsCreate/ProjectsCreate'
import { useGetProjectFiles } from '../hooks/useGetProjectFiles'
import { fetchSpecificFields } from '../hooks/getSpecificFields'
import { getDefaultValues } from '../utils'
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

import { groupBy, map } from 'lodash'

const ProjectsEdit = ({
  project,
  mode,
}: {
  project: ProjectTypeApi
  mode: string
}) => {
  const project_id = project.id.toString()

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

  const { data: projectFiles } = useGetProjectFiles(project_id)
  const [files, setFiles] = useState<ProjectFilesObject>({
    deletedFilesIds: [],
    newFiles: [],
  })

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

  return (
    <>
      <ProjectsHeader
        {...{
          mode,
          project,
          projectData,
          files,
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
        }}
      />
    </>
  )
}

export default ProjectsEdit
