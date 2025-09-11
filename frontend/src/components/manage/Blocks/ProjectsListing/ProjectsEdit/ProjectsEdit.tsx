'use client'

import { useContext, useEffect, useMemo, useRef, useState } from 'react'

import ProjectsHeader from '../ProjectSubmission/ProjectsHeader'
import ProjectsCreate from '../ProjectsCreate/ProjectsCreate'
import ProjectFormFooter from '../ProjectFormFooter'
import useGetRelatedProjects from '../hooks/useGetRelatedProjects'
import { useGetProjectFiles } from '../hooks/useGetProjectFiles'
import { fetchSpecificFields } from '../hooks/getSpecificFields'
import {
  getDefaultValues,
  getFileFromMetadata,
  getNonFieldErrors,
  hasSpecificField,
} from '../utils'
import {
  OdsOdpFields,
  ProjectData,
  ProjectFile,
  ProjectFilesObject,
  ProjectSpecificFields,
  ProjectTypeApi,
  SpecificFields,
  RelatedProjectsType,
  TrancheErrorType,
} from '../interfaces'
import {
  initialCrossCuttingFields,
  initialProjectIdentifiers,
} from '../constants'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { useStore } from '@ors/store'
import { api } from '@ors/helpers'

import { debounce, groupBy, map, filter, find, replace, isArray } from 'lodash'
import { enqueueSnackbar } from 'notistack'

const ProjectsEdit = ({
  project,
  mode,
  postExComUpdate = false,
}: {
  project: ProjectTypeApi
  mode: string
  postExComUpdate?: boolean
}) => {
  const project_id = project.id.toString()
  const isEditMode = mode === 'edit'
  const isVersion3 = isEditMode && project.version >= 3

  const { canViewProjects, canEditApprovedProjects } =
    useContext(PermissionsContext)
  const { clusters, project_types, sectors, subsectors } =
    useContext(ProjectsDataContext)

  const shouldEmptyField = (data: any, crtDataId: number) => {
    const isObsoleteField = find(
      data,
      (entry) => entry.id === crtDataId,
    )?.obsolete
    return mode !== 'edit' && isObsoleteField
  }
  const shouldEmptyCluster = shouldEmptyField(clusters, project.cluster_id)
  const shouldEmptySubsector =
    mode !== 'edit' &&
    find(subsectors, (subsector) =>
      map(project.subsectors, 'id').includes(subsector.id),
    )?.obsolete

  const [projectData, setProjectData] = useState<ProjectData>({
    projIdentifiers: initialProjectIdentifiers,
    bpLinking: { isLinkedToBP: false, bpId: null },
    crossCuttingFields: initialCrossCuttingFields,
    projectSpecificFields: {} as SpecificFields,
    approvalFields: {} as SpecificFields,
  })
  const [specificFields, setSpecificFields] = useState<ProjectSpecificFields[]>(
    [],
  )
  const [specificFieldsLoaded, setSpecificFieldsLoaded] =
    useState<boolean>(false)
  const [canViewTabs, setCanViewTabs] = useState<boolean>(false)

  const { projIdentifiers, crossCuttingFields } = projectData
  const { cluster } = projIdentifiers
  const { project_type, sector } = crossCuttingFields

  const groupedFields = groupBy(specificFields, 'table')
  const fieldsOfProject = groupedFields['project'] || []
  const projectFields = isEditMode
    ? fieldsOfProject
    : filter(fieldsOfProject, (field) => !field.is_actual)
  const odsOdpFields = (groupedFields['ods_odp'] || []).filter(
    (field) => field.read_field_name !== 'sort_order',
  )

  const fieldsValuesLoaded = useRef<boolean>(false)
  const filesLoaded = useRef<boolean>(false)
  const approvalFieldsValuesLoaded = useRef<boolean>(false)

  const { files: data, loadedFiles } = useGetProjectFiles(parseInt(project_id))

  const {
    fetchProjectFields,
    projectFields: allFields,
    setViewableFields,
    setEditableFields,
  } = useStore((state) => state.projectFields)
  const projectSlice = useStore((state) => state.projects)
  const meetings = projectSlice.meetings.data

  const debouncedFetchProjectFields = useMemo(
    () => debounce(() => fetchProjectFields?.(), 0),
    [fetchProjectFields],
  )

  useEffect(() => {
    debouncedFetchProjectFields()
  }, [])

  useEffect(() => {
    if (allFields && allFields.loaded && allFields.data) {
      const version = isEditMode ? project.version : 1
      const submissionStatus = isEditMode
        ? project.submission_status
        : undefined

      setViewableFields?.(version, submissionStatus)
      setEditableFields?.(version, submissionStatus, canEditApprovedProjects)
    }
  }, [allFields, setViewableFields, setEditableFields])

  const approvalFields =
    isVersion3 && isArray(allFields)
      ? allFields.filter((field) => field.section === 'Approval')
      : []

  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([])
  const [files, setFiles] = useState<ProjectFilesObject>({
    deletedFilesIds: [],
    newFiles: [],
  })

  useEffect(() => {
    if (!loadedFiles) return

    setProjectFiles(data)
    filesLoaded.current = true

    if ((mode === 'copy' || mode === 'full-link') && data?.length > 0) {
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
  }, [data, loadedFiles])

  useEffect(() => {
    if (isEditMode) {
      setFiles({
        deletedFilesIds: [],
        newFiles: [],
      })
    }
  }, [projectFiles])

  const relatedProjects = useGetRelatedProjects(project, mode)

  const defaultTrancheErrors = {
    errorText: '',
    isError: false,
    tranchesData: [],
    loaded: false,
  }

  const [projectId, setProjectId] = useState<number | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false)

  const [errors, setErrors] = useState<{ [key: string]: [] }>({})
  const [fileErrors, setFileErrors] = useState<string>('')
  const [otherErrors, setOtherErrors] = useState<string>('')
  const [trancheErrors, setTrancheErrors] =
    useState<TrancheErrorType>(defaultTrancheErrors)

  const nonFieldsErrors = getNonFieldErrors(errors)

  useEffect(() => {
    setProjectData((prevData) => ({
      ...prevData,
      projIdentifiers: {
        ...prevData.projIdentifiers,
        country: project.country_id,
        meeting: mode !== 'partial-link' ? project.meeting_id : null,
        agency: project.agency_id,
        lead_agency: project.meta_project?.lead_agency,
        lead_agency_submitting_on_behalf:
          project.lead_agency_submitting_on_behalf,
        cluster: !shouldEmptyCluster ? project.cluster_id : null,
        production: !shouldEmptyCluster ? project.production : false,
        post_excom_meeting: project.post_excom_meeting_id,
        post_excom_decision: project.post_excom_decision_id,
      },
      ...(mode !== 'partial-link'
        ? {
            bpLinking: {
              isLinkedToBP: !!project.bp_activity,
              bpId: project.bp_activity?.id ?? null,
            },
            crossCuttingFields: {
              project_type: !shouldEmptyField(
                project_types,
                project.project_type_id,
              )
                ? project.project_type_id
                : null,
              sector: !shouldEmptyField(sectors, project.sector_id)
                ? project.sector_id
                : null,
              subsector_ids: !shouldEmptySubsector
                ? map(project.subsectors, 'id')
                : [],
              is_lvc: project.is_lvc,
              title: project.title,
              description: project.description,
              project_start_date: project.project_start_date,
              project_end_date: project.project_end_date,
              total_fund: project.total_fund,
              support_cost_psc: project.support_cost_psc,
              individual_consideration: isEditMode
                ? project.individual_consideration
                : true,
            },
          }
        : {
            bpLinking: { isLinkedToBP: false, bpId: null },
            crossCuttingFields: {
              ...initialCrossCuttingFields,
              is_lvc: project.is_lvc,
            },
          }),
    }))
  }, [])

  useEffect(() => {
    setSpecificFieldsLoaded(false)

    if (cluster && project_type && sector) {
      fetchSpecificFields(
        cluster,
        project_type,
        sector,
        setSpecificFields,
        isEditMode ? project_id : null,
        setSpecificFieldsLoaded,
      )
    } else {
      setSpecificFields([])
      if (fieldsValuesLoaded.current) {
        setSpecificFieldsLoaded(true)
      }

      setCanViewTabs(true)
    }
  }, [cluster, project_type, sector])

  useEffect(() => {
    if (
      isVersion3 &&
      !approvalFieldsValuesLoaded.current &&
      approvalFields.length > 0
    ) {
      setProjectData((prevData) => ({
        ...prevData,
        approvalFields: {
          ...getDefaultValues<ProjectTypeApi>(approvalFields, project),
          meeting_approved: find(
            meetings,
            (option) => option.number === project.meeting_approved,
          )?.id,
          decision: project.decision_id,
        },
      }))
      approvalFieldsValuesLoaded.current = true
    }
  }, [approvalFields, approvalFieldsValuesLoaded])

  useEffect(() => {
    if (!fieldsValuesLoaded.current && specificFields.length > 0) {
      setProjectData((prevData) => ({
        ...prevData,
        ...(mode !== 'partial-link'
          ? {
              projectSpecificFields: {
                ...getDefaultValues<ProjectTypeApi>(projectFields, project),
                ods_odp: map(project.ods_odp, (ods) => {
                  return {
                    ...getDefaultValues<OdsOdpFields>(odsOdpFields, ods),
                  }
                }),
              },
            }
          : {
              projectSpecificFields: {
                ...getDefaultValues<ProjectTypeApi>(projectFields),
                ods_odp: [],
              },
            }),
      }))

      fieldsValuesLoaded.current = true
    }

    if (
      !fieldsValuesLoaded.current &&
      (mode === 'partial-link' ||
        (specificFieldsLoaded && specificFields.length === 0))
    ) {
      fieldsValuesLoaded.current = true
    }
  }, [specificFields, fieldsValuesLoaded])

  const tranche = projectData.projectSpecificFields?.tranche ?? 0

  const getTrancheErrors = async () => {
    setTrancheErrors((prevErrors) => {
      return { ...prevErrors, loaded: false }
    })

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
          loaded: true,
        })
      } else {
        const tranches = result.map((entry: RelatedProjectsType) => {
          const filteredWarnings = filter(entry.warnings, (warning) => {
            const crtField = find(
              projectFields,
              (field) =>
                field.write_field_name ===
                replace(warning.field, /_?actual_?/g, ''),
            )

            return crtField && crtField.data_type !== 'boolean'
          })

          return {
            title: entry.title,
            id: entry.id,
            errors: entry.errors,
            warnings: filteredWarnings,
          }
        })
        const trancheError = tranches.find(
          (tranche: RelatedProjectsType) => tranche.errors.length > 0,
        )

        setTrancheErrors({
          errorText: trancheError ? trancheError.errors[0].message : '',
          isError: false,
          tranchesData: tranches,
          loaded: true,
        })
      }
    } catch (error) {
      setTrancheErrors({
        errorText: '',
        isError: false,
        tranchesData: [],
        loaded: true,
      })
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
    const hasTrancheField = hasSpecificField(specificFields, 'tranche')

    if (mode !== 'edit' || tranche <= 1 || !hasTrancheField) {
      setTrancheErrors({
        errorText: '',
        isError: false,
        tranchesData: [],
        loaded: true,
      })
    } else if (isEditMode && canViewProjects) {
      debouncedGetTrancheErrors()
    }
  }, [tranche, project_id, specificFields])

  return (
    canViewTabs && (
      <>
        <ProjectsHeader
          {...{
            mode,
            postExComUpdate,
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
            approvalFields,
            specificFieldsLoaded,
            setProjectData,
          }}
        />
        <ProjectsCreate
          {...{
            projectData,
            setProjectData,
            mode,
            postExComUpdate,
            specificFields,
            project,
            files,
            setFiles,
            projectFiles,
            errors,
            hasSubmitted,
            fileErrors,
            trancheErrors,
            getTrancheErrors,
            relatedProjects,
            approvalFields,
          }}
          specificFieldsLoaded={
            (specificFieldsLoaded && fieldsValuesLoaded.current) ||
            !(cluster && project_type && sector)
          }
          loadedFiles={loadedFiles && filesLoaded.current}
        />
        <ProjectFormFooter
          id={projectId}
          href={`/projects-listing/${projectId}`}
          successMessage={
            isEditMode
              ? 'Updated project successfully.'
              : 'Submission was successful.'
          }
          successRedirectMessage="View project."
          {...{ nonFieldsErrors, otherErrors }}
        />
      </>
    )
  )
}

export default ProjectsEdit
