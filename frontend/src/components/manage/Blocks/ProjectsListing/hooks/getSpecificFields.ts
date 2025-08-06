import { Dispatch, SetStateAction } from 'react'

import { ProjectSpecificFields } from '../interfaces'
import { getSectionFields } from '../utils'
import { api } from '@ors/helpers'

export const fetchSpecificFields = async (
  cluster: number,
  project_type: number,
  sector: number,
  setFields: Dispatch<SetStateAction<ProjectSpecificFields[]>>,
  project_id?: string | null,
  setSpecificFieldsLoaded?: (isLoaded: boolean) => void,
  setApprovalFields?: (fields: ProjectSpecificFields[]) => void,
) => {
  let url = `/api/project-cluster/${cluster}/type/${project_type}/sector/${sector}/fields/?`

  url += project_id ? `project_id=${project_id}` : 'include_actuals=false'

  try {
    const res = await api(url)
    const formattedFields = ((res.fields as ProjectSpecificFields[]) || [])
      .map((field) => {
        return { ...field, label: field.label.replace(/(?<=CO)2/g, '₂') }
      })
      .sort(
        (field1, field2) => (field1.sort_order ?? 0) - (field2.sort_order ?? 0),
      )

    const specificFields = formattedFields.filter((field) =>
      ['Header', 'Substance Details', 'Impact'].includes(field.section),
    )
    const approvalFields = getSectionFields(formattedFields, 'Approval')

    setFields(specificFields)
    setApprovalFields?.(approvalFields)
  } catch (e) {
    console.error('Error at loading project specific fields')
    setFields([])
    setApprovalFields?.([])
  } finally {
    setSpecificFieldsLoaded?.(true)
  }
}
