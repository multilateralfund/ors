import { PropsWithChildren, useState } from 'react'

import { useGetPCRProject } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCRProject'
import { PCRData } from '@ors/components/manage/Blocks/PCR/interfaces'
import PCRDataContext from './PCRDataContext'
import { useUpdatedFields } from '../Projects/UpdatedFieldsContext'

import { useParams } from 'wouter'

const PCRDataProvider = (props: PropsWithChildren) => {
  const { children } = props

  const { project_id } = useParams<Record<string, string>>()
  const pcrMetaproject = useGetPCRProject(project_id)

  const { addUpdatedField } = useUpdatedFields()

  const [PCRData, setPCRDataNoFieldTracking] = useState<PCRData>({
    summary_of_key_data: [],
    results_assessment: [],
    causes_of_delay: [],
    lessons_learned: [],
    gender_mainstreaming: [],
    sdg_contribution: [],
  })

  const setPCRData = (
    updater: React.SetStateAction<PCRData>,
    fieldName?: string,
  ) => {
    setPCRDataNoFieldTracking((prevData) => {
      if (fieldName) {
        addUpdatedField(fieldName)
      }

      return typeof updater === 'function'
        ? (updater as (prev: PCRData) => PCRData)(prevData)
        : updater
    })
  }

  return (
    <PCRDataContext.Provider value={{ pcrMetaproject, PCRData, setPCRData }}>
      {children}
    </PCRDataContext.Provider>
  )
}

export default PCRDataProvider
