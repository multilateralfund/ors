import { SpecificFieldsSectionProps, ProjectData } from '../interfaces'
import { widgets } from './SpecificFieldsHelpers'

const ProjectImpact = ({
  projectData,
  setProjectData,
  sectionFields,
  errors,
  projectId,
}: SpecificFieldsSectionProps) => {
  return (
    <div className="grid grid-cols-4 gap-x-20 gap-y-3">
      {sectionFields.map((field) =>
        widgets[field.data_type]<ProjectData>(
          projectData,
          setProjectData,
          field,
          errors as { [key: string]: string[] },
          projectId,
        ),
      )}
    </div>
  )
}

export default ProjectImpact
