import { PropsWithChildren, useState } from 'react'

import { PCRData } from '@ors/components/manage/Blocks/PCR/interfaces'
import PCRDataContext from './PCRDataContext'
import { useUpdatedFields } from '../Projects/UpdatedFieldsContext'
import useApi from '@ors/hooks/useApi'

const PCRDataProvider = (props: PropsWithChildren) => {
  const { children } = props

  const { addUpdatedField } = useUpdatedFields()

  const [PCRData, setPCRDataNoFieldTracking] = useState<PCRData>({
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

  const { data: statuses } = useApi({
    options: { withStoreCache: true },
    path: 'api/project-statuses/',
  })

  return (
    <PCRDataContext.Provider value={{ PCRData, setPCRData, statuses }}>
      {children}
    </PCRDataContext.Provider>
  )
}

export default PCRDataProvider
