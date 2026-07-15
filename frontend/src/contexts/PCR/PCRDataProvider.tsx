import {
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react'

import { useGetPCRProject } from '@ors/components/manage/Blocks/PCR/hooks/useGetPCRProject'
import { PCRData } from '@ors/components/manage/Blocks/PCR/interfaces'
import PCRDataContext from './PCRDataContext'
import { useUpdatedFields } from '../Projects/UpdatedFieldsContext'
import useApi from '@ors/hooks/useApi'

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

  const setPCRData = useCallback(
    (updater: SetStateAction<PCRData>, fieldName?: string) => {
      if (fieldName) {
        addUpdatedField(fieldName)
      }

      setPCRDataNoFieldTracking((prevData) =>
        typeof updater === 'function'
          ? (updater as (prev: PCRData) => PCRData)(prevData)
          : updater,
      )
    },
    [addUpdatedField],
  )

  const { data: regions } = useApi({
    options: {
      withStoreCache: true,
      params: { location_type: 'Region' },
    },
    path: 'api/countries/',
  })

  const value = useMemo(
    () => ({ pcrMetaproject, PCRData, setPCRData, regions }),
    [pcrMetaproject, PCRData, setPCRData, regions],
  )

  return (
    <PCRDataContext.Provider
      value={value}
    >
      {children}
    </PCRDataContext.Provider>
  )
}

export default PCRDataProvider
