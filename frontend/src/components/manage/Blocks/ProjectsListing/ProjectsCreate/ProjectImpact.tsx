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
    <div className="grid grid-cols-4 gap-x-20 gap-y-3">
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
