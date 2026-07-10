import { PropsWithChildren, useMemo, useState } from 'react'

import { useGetPCRProject } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCRProject'
import { PCRData } from '@ors/components/manage/Blocks/PCR/interfaces'
import PCRDataContext from './PCRDataContext'
import { useUpdatedFields } from '../Projects/UpdatedFieldsContext'

import { map, uniq } from 'lodash'
import { useParams } from 'wouter'

const PCRDataProvider = (props: PropsWithChildren) => {
  const { children } = props

  const { project_id } = useParams<Record<string, string>>()
  const pcrMetaproject = useGetPCRProject(project_id)
  const { data } = pcrMetaproject

  const pcrAgencies = useMemo(
    () => uniq(map(data?.projects, 'agency_id')),
    [data],
  )

  const { addUpdatedField } = useUpdatedFields()

  const [PCRData, setPCRDataNoFieldTracking] = useState<PCRData>({
    summary_of_key_data: [],
    results_assessment: [],
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
    <PCRDataContext.Provider
      value={{ pcrMetaproject, pcrAgencies, PCRData, setPCRData }}
    >
      {children}
    </PCRDataContext.Provider>
  )
}

export default PCRDataProvider
