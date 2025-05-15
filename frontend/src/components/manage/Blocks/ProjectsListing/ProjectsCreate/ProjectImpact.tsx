import { widgets } from './SpecificFieldsHelpers'
import { SpecificFieldsSectionProps } from '../interfaces'

const ProjectImpact = ({
  projectSpecificFields,
  setProjectSpecificFields,
  fields,
}: SpecificFieldsSectionProps) => {
  return (
    <div className="flex flex-col gap-y-2">
      <div className="grid grid-cols-4 gap-x-20 gap-y-3">
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
