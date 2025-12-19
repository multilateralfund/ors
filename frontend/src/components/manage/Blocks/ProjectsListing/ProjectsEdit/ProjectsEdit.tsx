'use client'

import { useContext, useEffect, useMemo, useRef, useState } from 'react'

import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import ProjectsHeader from '../ProjectSubmission/ProjectsHeader'
import ProjectsCreate from '../ProjectsCreate/ProjectsCreate'
import ProjectFormFooter from '../ProjectFormFooter'
import useGetRelatedProjects from '../hooks/useGetRelatedProjects'
import { useGetProjectFiles } from '../hooks/useGetProjectFiles'
import { fetchSpecificFields } from '../hooks/getSpecificFields'
import {
  filterApprovalFields,
  getDefaultValues,
  getFieldData,
  getFileFromMetadata,
  getFormattedDecimalValue,
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
  BpDataProps,
  FileMetaDataType,
} from '../interfaces'
import {
  approvalOdsFields,
  considerationOpts,
  initialCrossCuttingFields,
  initialProjectIdentifiers,
} from '../constants'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'
import { useStore } from '@ors/store'
import { api } from '@ors/helpers'

import { enqueueSnackbar } from 'notistack'
import {
  debounce,
  groupBy,
  map,
  filter,
  find,
  replace,
  isArray,
  pick,
  mapKeys,
} from 'lodash'

const ProjectsEdit = ({
  project,
  mode,
  postExComUpdate = false,
  approval = false,
}: {
  project: ProjectTypeApi
  mode: string
  postExComUpdate?: boolean
  approval?: boolean
}) => {
  const project_id = project.id.toString()
  const isEditMode = mode === 'edit'
  const isVersion3 = isEditMode && project.version >= 3

  const { canViewProjects, canEditApprovedProjects, canViewBp } =
    useContext(PermissionsContext)
  const { countries, clusters, project_types, sectors, subsectors } =
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
  const { country, agency, cluster } = projIdentifiers
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
  const areFilesLoaded = loadedFiles && filesLoaded.current

  const {
    fetchProjectFields,
    projectFields: allFields,
    setViewableFields,
    setEditableFields,
  } = useStore((state) => state.projectFields)

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
      setEditableFields?.(
        version,
        submissionStatus,
        canEditApprovedProjects,
        postExComUpdate,
        mode,
      )
    }
  }, [allFields, setViewableFields, setEditableFields])

  const approvalFields =
    isVersion3 && isArray(allFields)
      ? allFields.filter((field) => filterApprovalFields(specificFields, field))
      : []

  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([])
  const [files, setFiles] = useState<ProjectFilesObject>({
    deletedFilesIds: [],
    newFiles: [],
  })
  const [filesMetaData, setFilesMetaData] = useState<FileMetaDataType[]>([])

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

        setFilesMetaData((prev) => [
          ...prev,
          ...map(data, (file) => ({
            id: null,
            name: file.filename,
            type: file.type,
          })),
        ])
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
      setFilesMetaData(projectFiles)
    }
  }, [projectFiles])

  const [metaProjectId, setMetaProjectId] = useState<number | null>(
    project.meta_project_id,
  )
  const relatedProjects = useGetRelatedProjects(project, mode, metaProjectId)

  const defaultTrancheErrors = {
    errorText: '',
    isError: false,
    tranchesData: [],
    loaded: false,
    loading: false,
  }

  const [bpData, setBpData] = useState({
    hasBpData: false,
    bpDataLoading: false,
  })
  const [projectId, setProjectId] = useState<number | null>(null)

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
        meeting: project.meeting_id,
        agency: project.agency_id,
        lead_agency: project.lead_agency,
        lead_agency_submitting_on_behalf:
          project.lead_agency_submitting_on_behalf,
        cluster: !shouldEmptyCluster ? project.cluster_id : null,
        production: !shouldEmptyCluster ? project.production : false,
        category: !shouldEmptyCluster ? project.cluster?.category : null,
        post_excom_meeting:
          mode === 'edit' ? project.post_excom_meeting_id : null,
        post_excom_decision:
          mode === 'edit' ? project.post_excom_decision_id : null,
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
              total_fund: getFormattedDecimalValue(project.total_fund),
              support_cost_psc: getFormattedDecimalValue(
                project.support_cost_psc,
              ),
              blanket_or_individual_consideration:
                isEditMode &&
                (project.submission_status !== 'Draft' || project.version === 2)
                  ? (considerationOpts.find(
                      (opt) =>
                        opt.value ===
                        project.blanket_or_individual_consideration,
                    )?.id ?? null)
                  : null,
            },
          }
        : {
            bpLinking: { isLinkedToBP: false, bpId: null },
            crossCuttingFields: {
              ...initialCrossCuttingFields,
              is_lvc:
                find(countries, { id: project.country_id })?.is_lvc ?? null,
            },
          }),
    }))
  }, [])

  useEffect(() => {
    if (!approval && canViewBp && country && agency && cluster) {
      setBpData({
        hasBpData: false,
        bpDataLoading: true,
      })
    }
  }, [country, agency, cluster])

  const onBpDataChange = (bpData: BpDataProps) => {
    setBpData(bpData)
  }

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
      const approvalFieldsNames = approvalFields.map((f) => f.write_field_name)

      const totalFieldsValues = pick(
        Object.fromEntries(
          approvalOdsFields.map((field) => [
            field,
            project[field as keyof ProjectTypeApi] ?? undefined,
          ]),
        ),
        approvalFieldsNames,
      )

      const filteredFieldsValues = pick(
        Object.fromEntries(
          approvalOdsFields.map((field) => [
            field,
            project[field as keyof ProjectTypeApi] ??
              project[`computed_${field}` as keyof ProjectTypeApi],
          ]),
        ),
        approvalFieldsNames,
      )

      const computedFieldsValues = mapKeys(
        filteredFieldsValues,
        (_, key) => `computed_${key}`,
      )

      setProjectData((prevData) => ({
        ...prevData,
        approvalFields: {
          ...getDefaultValues<ProjectTypeApi>(approvalFields, project),
          meeting: project.meeting_id,
          decision: project.decision_id,
          date_completion: project.project_end_date,
          ...computedFieldsValues,
          ...totalFieldsValues,
        },
      }))

      if (fieldsValuesLoaded.current) {
        approvalFieldsValuesLoaded.current = true
      }
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
                    ...getDefaultValues<OdsOdpFields>(
                      odsOdpFields,
                      ods,
                      getFieldData(specificFields, 'group')
                        ? project
                        : undefined,
                    ),
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
      return { ...prevErrors, loaded: false, loading: true }
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
            'A new tranche cannot be created as no previous tranche exists or you are not the lead agency of the MYA.',
          isError: true,
          tranchesData: [],
          loaded: true,
          loading: false,
        })

        return true
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
            tranche: entry.tranche,
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
          loading: false,
        })

        return !!trancheError && !!trancheError.errors[0].message
      }
    } catch (error) {
      setTrancheErrors({
        errorText: '',
        isError: false,
        tranchesData: [],
        loaded: true,
        loading: false,
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

      return true
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
        loading: false,
      })
    } else if (isEditMode && canViewProjects) {
      debouncedGetTrancheErrors()
    }
  }, [tranche, project_id, specificFields])

  const { updatedFields, addUpdatedField } = useUpdatedFields()

  const setProjectDataWithEditTracking = (
    updater: React.SetStateAction<ProjectData>,
    fieldName?: string,
  ) => {
    setProjectData((prevData) => {
      if (fieldName) {
        addUpdatedField(fieldName)
      }

      return typeof updater === 'function'
        ? (updater as (prev: ProjectData) => ProjectData)(prevData)
        : updater
    })
  }

  useVisibilityChange(updatedFields.size > 0)

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
            setFileErrors,
            setOtherErrors,
            setProjectFiles,
            specificFields,
            trancheErrors,
            getTrancheErrors,
            approvalFields,
            specificFieldsLoaded,
            setProjectData,
            bpData,
            filesMetaData,
          }}
          loadedFiles={areFilesLoaded}
        />
        <ProjectsCreate
          {...{
            projectData,
            mode,
            postExComUpdate,
            approval,
            specificFields,
            project,
            files,
            setFiles,
            projectFiles,
            errors,
            fileErrors,
            trancheErrors,
            getTrancheErrors,
            relatedProjects,
            approvalFields,
            bpData,
            onBpDataChange,
            filesMetaData,
            setFilesMetaData,
            metaProjectId,
            setMetaProjectId,
          }}
          setProjectData={setProjectDataWithEditTracking}
          specificFieldsLoaded={
            (specificFieldsLoaded && fieldsValuesLoaded.current) ||
            !(cluster && project_type && sector)
          }
          loadedFiles={areFilesLoaded}
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
