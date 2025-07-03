'use client'

import { useContext, useEffect, useRef, useState } from 'react'

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
  TrancheDataType,
  TrancheErrorType,
} from '../interfaces'
import {
  initialCrossCuttingFields,
  initialProjectIdentifiers,
} from '../constants'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { useStore } from '@ors/store'
import { api } from '@ors/helpers'

import { debounce, groupBy, map } from 'lodash'
import { enqueueSnackbar } from 'notistack'

const ProjectsEdit = ({
  project,
  mode,
}: {
  project: ProjectTypeApi
  mode: string
}) => {
  const project_id = project.id.toString()

  const { canViewProjects } = useContext(PermissionsContext)
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
  const [specificFieldsLoaded, setSpecificFieldsLoaded] =
    useState<boolean>(false)

  const { projIdentifiers, crossCuttingFields } = projectData
  const { cluster } = projIdentifiers
  const { project_type, sector } = crossCuttingFields

  const groupedFields = groupBy(specificFields, 'table')
  const projectFields = groupedFields['project'] || []
  const odsOdpFields = (groupedFields['ods_odp'] || []).filter(
    (field) => field.read_field_name !== 'sort_order',
  )

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
  const [trancheErrors, setTrancheErrors] = useState<TrancheErrorType>({
    errorText: '',
    isError: false,
    tranchesData: [],
  })

  const nonFieldsErrors = getNonFieldErrors(errors)

  useEffect(() => {
    setProjectData((prevData) => ({
      ...prevData,
      projIdentifiers: {
        country: project.country_id,
        meeting: mode !== 'partial-link' ? project.meeting_id : null,
        current_agency: agency_id ?? project.agency_id,
        side_agency:
          !agency_id || project.agency_id === agency_id
            ? null
            : project.agency_id,
        is_lead_agency: agency_id ? project.agency_id === agency_id : true,
        cluster: project.cluster_id,
      },
      ...(mode !== 'partial-link'
        ? {
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
          }
        : {
            bpLinking: { isLinkedToBP: false, bpId: null },
            crossCuttingFields: initialCrossCuttingFields,
          }),
    }))
  }, [])

  useEffect(() => {
    if (cluster && project_type && sector) {
      fetchSpecificFields(
        cluster,
        project_type,
        sector,
        setSpecificFields,
        mode === 'edit' ? project_id : null,
        setSpecificFieldsLoaded,
      )
    } else setSpecificFields([])

    if (mode === 'partial-link') {
      setSpecificFieldsLoaded(true)
    }
  }, [cluster, project_type, sector])

  useEffect(() => {
    if (specificFields.length > 0 && !fieldsValuesLoaded.current) {
      setProjectData((prevData) => ({
        ...prevData,
        ...(mode !== 'partial-link' && {
          projectSpecificFields: {
            ...getDefaultValues<ProjectTypeApi>(projectFields, project),
            ods_odp: map(project.ods_odp, (ods) => {
              return {
                ...getDefaultValues<OdsOdpFields>(odsOdpFields, ods),
              }
            }),
          },
        }),
      }))

      fieldsValuesLoaded.current = true
    }
  }, [specificFields, fieldsValuesLoaded])

  const tranche = projectData.projectSpecificFields?.tranche ?? 0

  const getTrancheErrors = async () => {
    setTrancheErrors({ errorText: '', isError: false, tranchesData: [] })

    try {
      const result = await api(
        `api/projects/v2/${project_id}/list_previous_tranches/?tranche=${tranche}&include_validation=true`,
        {
          withStoreCache: false,
        },
        false,
      )

      if (result.length === 0) {
        setTrancheErrors({
          errorText:
            'A new tranche cannot be created unless a previous one exists.',
          isError: true,
          tranchesData: [],
        })
      } else {
        const tranches = result.map((entry: TrancheDataType) => {
          return {
            title: entry.title,
            id: entry.id,
            errors: entry.errors,
            warnings: entry.warnings,
          }
        })
        const trancheError = tranches.find(
          (tranche: TrancheDataType) => tranche.errors.length > 0,
        )

        if (trancheError) {
          setTrancheErrors({
            errorText: trancheError.errors[0].message,
            isError: false,
            tranchesData: tranches,
          })
        } else {
          setTrancheErrors({
            errorText: '',
            isError: false,
            tranchesData: tranches,
          })
        }
      }
    } catch (error) {
      enqueueSnackbar(
        <>
          An error occurred during previous tranches validation. Please try
          again.
        </>,
        {
          variant: 'error',
        },
      )
    }
  }

  const debouncedGetTrancheErrors = debounce(getTrancheErrors, 0)

  useEffect(() => {
    if (mode !== 'edit' || tranche <= 1) {
      setTrancheErrors({ errorText: '', isError: false, tranchesData: [] })
    } else if (mode === 'edit' && canViewProjects) {
      debouncedGetTrancheErrors()
    }
  }, [tranche, project_id])

  return (
    specificFieldsLoaded && (
      <>
        <ProjectsHeader
          {...{
            mode,
            project,
            projectData,
            projectFiles,
            files,
            setProjectId,
            setErrors,
            setHasSubmitted,
            setFileErrors,
            setOtherErrors,
            setProjectFiles,
            specificFields,
            trancheErrors,
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
            trancheErrors,
            getTrancheErrors,
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
  )
}

export default ProjectsEdit
