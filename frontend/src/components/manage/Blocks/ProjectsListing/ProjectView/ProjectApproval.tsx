import { useCallback } from 'react'

import { viewModesHandler } from './ViewHelperComponents'
import { viewColumnsClassName } from '../constants'
import { ProjectViewProps } from '../interfaces'
import { canViewField } from '../utils'
import { useStore } from '@ors/store'

import { map } from 'lodash'

const ProjectApproval = ({
  project,
  specificFields,
  fieldHistory,
}: { fieldHistory: any } & ProjectViewProps) => {
  const { viewableFields } = useStore((state) => state.projectFields)

  const getFieldHistory = useCallback(
    (name: string) => {
      return fieldHistory?.[name] ?? []
    },
    [fieldHistory],
  )

  return (
    <div className="flex w-full flex-col gap-4">
      <div className={viewColumnsClassName}>
        {map(
          specificFields,
          (field) =>
            canViewField(viewableFields, field.write_field_name) && (
              <span key={field.write_field_name}>
                {viewModesHandler[field.data_type](
                  project,
                  field,
                  field.write_field_name === 'excom_provision'
                    ? {
                        containerClassName: '!basis-full w-full',
                        className: 'whitespace-nowrap',
                        fieldClassName: 'max-w-[50%]',
                      }
                    : undefined,
                  getFieldHistory(field.write_field_name),
                )}
              </span>
            ),
        )}
      </div>
    </div>
  )
}

export default ProjectApproval
