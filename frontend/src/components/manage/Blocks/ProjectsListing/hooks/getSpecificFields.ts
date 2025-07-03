import { Dispatch, SetStateAction } from 'react'

import { ProjectSpecificFields } from '../interfaces'
import { api } from '@ors/helpers'

export const fetchSpecificFields = async (
  cluster: number,
  project_type: number,
  sector: number,
  setFields: Dispatch<SetStateAction<ProjectSpecificFields[]>>,
  project_id?: string | null,
  setSpecificFieldsLoaded?: (isLoaded: boolean) => void,
) => {
  let url = `/api/project-cluster/${cluster}/type/${project_type}/sector/${sector}/fields/`

  if (project_id) {
    url += `?project_id=${project_id}`
  }

  try {
    const res = await api(url)
    setFields(res.fields || [])
  } catch (e) {
    console.error('Error at loading project specific fields')
    setFields([])
  } finally {
    setSpecificFieldsLoaded?.(true)
  }
}
