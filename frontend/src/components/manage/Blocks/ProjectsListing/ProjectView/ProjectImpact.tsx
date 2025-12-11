import { useCallback } from 'react'

import { viewModesHandler } from './ViewHelperComponents'
import { ProjectSpecificFields, ProjectViewProps } from '../interfaces'
import { canViewField, getSectionFields } from '../utils'
import { useStore } from '@ors/store'

import { chunk, find, map } from 'lodash'
import cx from 'classnames'

const ProjectImpact = ({
  project,
  specificFields,
  fieldHistory,
}: ProjectViewProps & { fieldHistory: any }) => {
  const fields = getSectionFields(specificFields, 'Impact')
  const hasActualFields = find(fields, (field) => field.is_actual)

  const { viewableFields } = useStore((state) => state.projectFields)

  const getFieldHistory = useCallback(
    (name: string) => {
      return fieldHistory?.[name] ?? []
    },
    [fieldHistory],
  )

  const ImpactFields = ({ fields }: { fields: ProjectSpecificFields[] }) =>
    map(
      fields,
      (field) =>
        canViewField(viewableFields, field.write_field_name) && (
          <span key={field.write_field_name}>
            {viewModesHandler[field.data_type](
              project,
              field,
              undefined,
              getFieldHistory(field.write_field_name),
              !!hasActualFields,
            )}
          </span>
        ),
    )

  return (
    <div className="flex w-full flex-col gap-4 opacity-100">
      <div className="flex w-3/4 grid-cols-2 flex-wrap gap-x-20 gap-y-4 md:grid">
        {hasActualFields ? (
          chunk(fields, 2).map((group, i) => (
            <div
              key={i}
              className={cx('flex flex-col gap-y-4', {
                'col-span-2 w-full': group[0].data_type === 'boolean',
              })}
            >
              <ImpactFields fields={group} />
            </div>
          ))
        ) : (
          <ImpactFields fields={fields} />
        )}
      </div>
    </div>
  )
}

export default ProjectImpact
