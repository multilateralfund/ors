import ProjectIdentifiersFields from './ProjectIdentifiersFields'
import ProjectBPLinking from './ProjectBPLinking'
import { ProjectIdentifiersSectionProps } from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'

import { Divider } from '@mui/material'

const ProjectIdentifiersSection = ({
  projectData,
  setProjectData,
  areNextSectionsDisabled,
  ...rest
}: ProjectIdentifiersSectionProps) => {
  return (
    <>
      <ProjectIdentifiersFields
        {...{ projectData, setProjectData, areNextSectionsDisabled }}
        {...rest}
      />
      <Divider className="my-6" />
      <ProjectBPLinking
        {...{
          projectData,
          setProjectData,
        }}
        isDisabled={areNextSectionsDisabled}
      />
    </>
  )
}

export default ProjectIdentifiersSection
