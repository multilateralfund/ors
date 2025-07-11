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
  let url = `/api/project-cluster/${cluster}/type/${project_type}/sector/${sector}/fields/?`

  url += project_id ? `project_id=${project_id}` : 'include_actuals=false'

  try {
    const res = await api(url)
    const formattedFields = (res.fields || []).sort(
      (field1: ProjectSpecificFields, field2: ProjectSpecificFields) =>
        (field1.sort_order ?? 0) - (field2.sort_order ?? 0),
    )

    setFields(formattedFields)
  } catch (e) {
    console.error('Error at loading project specific fields')
    setFields([])
  } finally {
    setSpecificFieldsLoaded?.(true)
  }
}
