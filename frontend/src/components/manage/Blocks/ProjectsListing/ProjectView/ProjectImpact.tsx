import { viewModesHandler } from './ViewHelperComponents'
import { canViewField, getSectionFields } from '../utils'
import { ProjectViewProps } from '../interfaces'
import { useStore } from '@ors/store'

import { map } from 'lodash'

const ProjectImpact = ({ project, specificFields }: ProjectViewProps) => {
  const fields = getSectionFields(specificFields, 'Impact')

  const { viewableFields } = useStore((state) => state.projectFields)

  return (
    <div className="flex w-full flex-col gap-4 opacity-100">
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {map(
          fields,
          (field) =>
            canViewField(viewableFields, field.write_field_name) &&
            viewModesHandler[field.data_type](project, field),
        )}
      </div>
    </div>
  )
}

export default ProjectImpact
