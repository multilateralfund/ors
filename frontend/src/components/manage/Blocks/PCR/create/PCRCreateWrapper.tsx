import { useEffect, useState } from 'react'

import { useGetProject } from '@ors/components/manage/Blocks/ProjectsListing/hooks/useGetProject'
import {
  FileMetaDataType,
  ProjectFilesObject,
} from '@ors/components/manage/Blocks/ProjectsListing/interfaces'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRCreate from './PCRCreate'
import { initialOverviewFields } from '../constants'
import { PCRData, ProjectElementCauseOfDelay } from '../interfaces'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'

import { useParams } from 'wouter'
import { map } from 'lodash'

const PCRCreateWrapper = () => {
  const { updatedFields, addUpdatedField, clearUpdatedFields } =
    useUpdatedFields()

  useEffect(() => {
    clearUpdatedFields()
  }, [])

  const { project_id } = useParams<Record<string, string>>()
  const { data: project } = useGetProject(project_id)

  const agencies = [1, 2, 3, 4]
  const initialCausesOfDelayFields = map(agencies, (agency) => ({
    agency,
    project_element: [],
  }))
  const initialLessonsLearnedFields = map(agencies, (agency) => ({
    agency,
    project_element: [],
  }))
  const initialGenderMainstreamingFields = map(agencies, (agency) => ({
    agency,
    phases: [],
  }))
  const initialSDGFields = map(agencies, (agency) => ({
    agency,
    sdgs: [],
  }))

  const [PCRData, setPCRData] = useState<PCRData>({
    overview: initialOverviewFields,
    summary_and_delays: [],
    results_assessment: [],
    causes_of_delay: initialCausesOfDelayFields,
    lessons_learned: initialLessonsLearnedFields,
    gender_mainstreaming: initialGenderMainstreamingFields,
    sdg_contribution: initialSDGFields,
  })
  const [files, setFiles] = useState<ProjectFilesObject>({
    deletedFilesIds: [],
    newFiles: [],
  })
  const [filesMetaData, setFilesMetaData] = useState<FileMetaDataType[]>([])

  const [errors, setErrors] = useState<{ [key: string]: string[] }>({})
  const [fileErrors, setFileErrors] = useState<string>('')

  useEffect(() => {
    if (project) {
      setPCRData((prev) => ({
        ...prev,
        overview: {
          ...prev.overview,
          country: project.country,
          metacode: project.metacode,
          meeting: project.meeting,
          date_of_approval: project.date_approved,
          date_of_completion: project.date_completion,
        },
      }))
    }
  }, [project])

  const setPCRDataWithEditTracking = (
    updater: React.SetStateAction<PCRData>,
    fieldName?: string,
  ) => {
    setPCRData((prevData) => {
      if (fieldName) {
        addUpdatedField(fieldName)
      }

      return typeof updater === 'function'
        ? (updater as (prev: PCRData) => PCRData)(prevData)
        : updater
    })
  }

  useVisibilityChange(updatedFields.size > 0)

  return (
    <>
      {/* <ProjectsHeader
        mode="add"
        {...{
          projectData,
          files,
          setErrors,
          setFileErrors,
          specificFields,
          trancheErrors,
          getTrancheErrors,
          specificFieldsLoaded,
          setProjectData,
          bpData,
          filesMetaData,
          shouldValidateTotalFund,
        }}
      /> */}
      <PCRCreate
        mode="add"
        {...{
          PCRData,
          files,
          setFiles,
          filesMetaData,
          setFilesMetaData,
          errors,
          fileErrors,
        }}
        setPCRData={setPCRDataWithEditTracking}
      />
    </>
  )
}

export default PCRCreateWrapper
