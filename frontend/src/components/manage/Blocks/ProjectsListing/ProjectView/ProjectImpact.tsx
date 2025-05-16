import { viewModesHandler } from './ViewHelperComponents'
import { ProjectViewProps } from '../interfaces'
import { getSectionFields } from '../utils'

import { map } from 'lodash'

const ProjectImpact = ({ project, specificFields }: ProjectViewProps) => {
  const fields = getSectionFields(specificFields, 'Impact')

  return (
    <div className="flex w-full flex-col gap-4 opacity-100">
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {map(fields, (field) =>
          viewModesHandler[field.data_type](project, field),
        )}
      </div>
    </div>
  )
}

export default ProjectImpact
