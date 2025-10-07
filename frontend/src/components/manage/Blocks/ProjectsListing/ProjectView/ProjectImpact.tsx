import { useCallback } from 'react'

import { viewModesHandler } from './ViewHelperComponents'
import { canViewField, getSectionFields } from '../utils'
import { viewColumnsClassName } from '../constants'
import { ProjectViewProps } from '../interfaces'
import { useStore } from '@ors/store'

import { map } from 'lodash'

const ProjectImpact = ({
  project,
  specificFields,
  fieldHistory,
}: ProjectViewProps & { fieldHistory: any }) => {
  const fields = getSectionFields(specificFields, 'Impact')

  const { viewableFields } = useStore((state) => state.projectFields)

  const getFieldHistory = useCallback(
    (name: string) => {
      return fieldHistory?.[name] ?? []
    },
    [fieldHistory],
  )

  return (
    <div className="flex w-full flex-col gap-4 opacity-100">
      <div className={viewColumnsClassName}>
        {map(
          fields,
          (field) =>
            canViewField(viewableFields, field.write_field_name) &&
            viewModesHandler[field.data_type](
              project,
              field,
              undefined,
              getFieldHistory(field.write_field_name),
            ),
        )}
      </div>
    </div>
  )
}

export default ProjectImpact
