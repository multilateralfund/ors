import { widgets } from './SpecificFieldsHelpers'
import { SpecificFieldsSectionProps } from '../interfaces'

import { filter } from 'lodash'

const ProjectImpact = ({
  projectSpecificFields,
  setProjectSpecificFields,
  specificFields,
}: SpecificFieldsSectionProps) => {
  const fields = filter(specificFields, (field) => field.section === 'Impact')
  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        {fields.map((field) =>
          widgets[field.data_type](
            field,
            projectSpecificFields,
            setProjectSpecificFields,
          ),
        )}
      </div>
    </div>
  )
}

export default ProjectImpact
