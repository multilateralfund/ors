import { SpecificFieldsSectionProps, ProjectData } from '../interfaces'
import { widgets } from './SpecificFieldsHelpers'

const ProjectImpact = ({
  projectData,
  setProjectData,
  sectionFields,
  errors = {},
  hasSubmitted,
}: SpecificFieldsSectionProps) => {
  return (
    <div className="flex w-[50%] grid-cols-2 flex-wrap gap-x-20 gap-y-3 md:grid md:w-auto lg:grid-cols-4">
      {sectionFields.map((field) =>
        widgets[field.data_type]<ProjectData>(
          projectData,
          setProjectData,
          field,
          errors,
          false,
          hasSubmitted,
        ),
      )}
    </div>
  )
}

export default ProjectImpact
