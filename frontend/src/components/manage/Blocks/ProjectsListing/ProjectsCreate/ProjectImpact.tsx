import { widgets } from './SpecificFieldsHelpers'
import { SpecificFieldsSectionProps, SpecificFields } from '../interfaces'

const ProjectImpact = ({
  fields,
  setFields,
  sectionFields,
}: SpecificFieldsSectionProps) => {
  return (
    <div className="grid grid-cols-4 gap-x-20 gap-y-3">
      {sectionFields.map((field) =>
        widgets[field.data_type]<SpecificFields>(fields, setFields, field),
      )}
    </div>
  )
}

export default ProjectImpact
