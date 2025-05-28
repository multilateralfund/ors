import { SpecificFieldsSectionProps, ProjectData } from '../interfaces'
import { widgets } from './SpecificFieldsHelpers'

const ProjectOverview = ({
  projectData,
  setProjectData,
  sectionFields,
  errors = {},
  hasSubmitted,
}: SpecificFieldsSectionProps) => {
  return (
    <>
      <div className="flex flex-wrap gap-x-20 gap-y-5">
        {sectionFields.map((field) =>
          widgets[field.data_type]<ProjectData>(
            projectData,
            setProjectData,
            field,
            errors,
            hasSubmitted,
          ),
        )}
      </div>
    </>
  )
}

export default ProjectOverview
