import { Dispatch, SetStateAction } from 'react'

import { ProjectSpecificFields } from '../interfaces'
import { api } from '@ors/helpers'

export const fetchSpecificFields = async (
  cluster: number,
  project_type: number,
  sector: number,
  setFields: Dispatch<SetStateAction<ProjectSpecificFields[]>>,
  setSpecificFieldsLoaded?: (isLoaded: boolean) => void,
) => {
  try {
    const res = await api(
      `/api/project-cluster/${cluster}/type/${project_type}/sector/${sector}/fields/`,
    )
    setFields(res.fields || [])
  } catch (e) {
    console.error('Error at loading project specific fields')
    setFields([])
  } finally {
    setSpecificFieldsLoaded?.(true)
  }
}
