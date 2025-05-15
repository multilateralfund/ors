import { SpecificFieldsSectionProps, SpecificFields } from '../interfaces'
import { widgets } from './SpecificFieldsHelpers'

const ProjectOverview = ({
  fields,
  setFields,
  sectionFields,
}: SpecificFieldsSectionProps) => {
  return (
    <>
      <div className="flex flex-wrap gap-x-20 gap-y-5">
        {sectionFields.map((field) =>
          widgets[field.data_type]<SpecificFields>(fields, setFields, field),
        )}
      </div>
    </>
  )
}

export default ProjectOverview
