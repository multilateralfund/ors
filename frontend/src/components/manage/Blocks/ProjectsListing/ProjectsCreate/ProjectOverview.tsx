import { SpecificFieldsSectionProps } from '../interfaces'
import { widgets } from './SpecificFieldsHelpers'

const ProjectOverview = ({
  projectSpecificFields,
  setProjectSpecificFields,
  fields,
}: SpecificFieldsSectionProps) => {
  return (
    <>
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
    </>
  )
}

export default ProjectOverview
