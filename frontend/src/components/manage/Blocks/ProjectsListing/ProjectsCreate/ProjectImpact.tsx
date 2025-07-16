import { SpecificFieldsSectionProps, ProjectData } from '../interfaces'
import { widgets } from './SpecificFieldsHelpers'
import { useStore } from '@ors/store'

const ProjectImpact = ({
  projectData,
  setProjectData,
  sectionFields,
  errors = {},
  hasSubmitted,
}: SpecificFieldsSectionProps) => {
  const { editableFields } = useStore((state) => state.projectFields)

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

          editableFields,
        ),
      )}
    </div>
  )
}

export default ProjectImpact
