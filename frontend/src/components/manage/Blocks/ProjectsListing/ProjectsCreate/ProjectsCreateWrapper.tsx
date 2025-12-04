'use client'

import { useContext, useEffect, useMemo, useState } from 'react'

import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext.tsx'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import ProjectsHeader from '../ProjectSubmission/ProjectsHeader.tsx'
import ProjectsCreate from './ProjectsCreate.tsx'
import ProjectFormFooter from '../ProjectFormFooter.tsx'
import { fetchSpecificFields } from '../hooks/getSpecificFields.ts'
import { getDefaultValues, getNonFieldErrors } from '../utils.ts'
import {
  initialCrossCuttingFields,
  initialProjectIdentifiers,
} from '../constants.ts'
import {
  BpDataProps,
  FileMetaDataType,
  ProjectData,
  ProjectFilesObject,
  ProjectSpecificFields,
  ProjectTypeApi,
  SpecificFields,
} from '../interfaces.ts'
import { useStore } from '@ors/store.tsx'

import { debounce, groupBy } from 'lodash'

const ProjectsCreateWrapper = () => {
  const userSlice = useStore((state) => state.user)
  const { agency_id } = userSlice.data

  const { canViewBp } = useContext(PermissionsContext)

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
      setViewableFields?.(1)
      setEditableFields?.(1)
    }
  }, [allFields, setViewableFields, setEditableFields])

  const [specificFields, setSpecificFields] = useState<ProjectSpecificFields[]>(
    [],
  )
  const [specificFieldsLoaded, setSpecificFieldsLoaded] =
    useState<boolean>(false)

  const groupedFields = groupBy(specificFields, 'table')
  const projectFields = groupedFields['project'] || []

  const initialProjectSpecificFields = {
    ...getDefaultValues<ProjectTypeApi>(projectFields),
    ods_odp: [],
  }

  const [projectData, setProjectData] = useState<ProjectData>({
    projIdentifiers: {
      ...initialProjectIdentifiers,
      agency: agency_id ?? null,
      lead_agency: agency_id ?? null,
    },
    bpLinking: { isLinkedToBP: false, bpId: null },
    crossCuttingFields: initialCrossCuttingFields,
    projectSpecificFields: initialProjectSpecificFields,
    approvalFields: {} as SpecificFields,
  })

  const { projIdentifiers, crossCuttingFields } = projectData
  const { country, agency, cluster } = projIdentifiers
  const { project_type, sector } = crossCuttingFields

  const [projectId, setProjectId] = useState<number | null>(null)
  const [files, setFiles] = useState<ProjectFilesObject>({
    deletedFilesIds: [],
    newFiles: [],
  })

  const [bpData, setBpData] = useState({
    hasBpData: false,
    bpDataLoading: false,
  })
  const [filesMetaData, setFilesMetaData] = useState<FileMetaDataType[]>([])

  const [errors, setErrors] = useState<{ [key: string]: [] }>({})
  const [fileErrors, setFileErrors] = useState<string>('')
  const [otherErrors, setOtherErrors] = useState<string>('')

  const nonFieldsErrors = getNonFieldErrors(errors)

  useEffect(() => {
    if (canViewBp && country && agency && cluster) {
      setBpData({
        hasBpData: false,
        bpDataLoading: true,
      })
    }
  }, [country, agency, cluster])

  useEffect(() => {
    setSpecificFieldsLoaded(false)

    if (cluster && project_type && sector) {
      fetchSpecificFields(
        cluster,
        project_type,
        sector,
        setSpecificFields,
        null,
        setSpecificFieldsLoaded,
      )
    } else {
      setSpecificFields([])
      setSpecificFieldsLoaded(true)
    }
  }, [cluster, project_type, sector])

  const onBpDataChange = (bpData: BpDataProps) => {
    setBpData(bpData)
  }

  const { addUpdatedField } = useUpdatedFields()

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

  return (
    <>
      <ProjectsHeader
        mode="add"
        {...{
          projectData,
          files,
          setProjectId,
          setErrors,
          setFileErrors,
          setOtherErrors,
          specificFields,
          specificFieldsLoaded,
          setProjectData,
          bpData,
          filesMetaData,
        }}
      />
      <ProjectsCreate
        mode="add"
        {...{
          projectData,
          specificFields,
          files,
          setFiles,
          errors,
          fileErrors,
          specificFieldsLoaded,
          bpData,
          onBpDataChange,
          filesMetaData,
          setFilesMetaData,
        }}
        setProjectData={setProjectDataWithEditTracking}
      />
      <ProjectFormFooter
        id={projectId}
        href={`/projects-listing/${projectId}`}
        successMessage="Submission was successful."
        successRedirectMessage="View project."
        {...{ nonFieldsErrors, otherErrors }}
      />
    </>
  )
}

export default ProjectsCreateWrapper
