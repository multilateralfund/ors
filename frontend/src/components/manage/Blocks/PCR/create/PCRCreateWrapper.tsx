import { useEffect, useState } from 'react'

import {
  FileMetaDataType,
  ProjectFilesObject,
} from '@ors/components/manage/Blocks/ProjectsListing/interfaces'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRCreate from './PCRCreate'
import { initialOverviewFields } from '../constants'
import { PCRData } from '../interfaces'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'

const PCRCreateWrapper = () => {
  const { updatedFields, addUpdatedField, clearUpdatedFields } =
    useUpdatedFields()

  useEffect(() => {
    clearUpdatedFields()
  }, [])

  const [PCRData, setPCRData] = useState<PCRData>({
    overview: initialOverviewFields,
    summary_and_delays: [],
    results_assessment: [],
    causes_of_delay: [],
    lessons_learned: [],
    gender_mainstreaming: [],
    sdg_contribution: [],
  })
  const [files, setFiles] = useState<ProjectFilesObject>({
    deletedFilesIds: [],
    newFiles: [],
  })
  const [filesMetaData, setFilesMetaData] = useState<FileMetaDataType[]>([])

  const [errors, setErrors] = useState<{ [key: string]: string[] }>({})
  const [fileErrors, setFileErrors] = useState<string>('')

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
