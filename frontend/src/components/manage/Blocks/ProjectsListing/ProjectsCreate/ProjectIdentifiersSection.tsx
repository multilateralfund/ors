import ProjectIdentifiersFields from './ProjectIdentifiersFields'
import ProjectBPLinking from './ProjectBPLinking'
import { ProjectIdentifiersSectionProps } from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'

import { Divider } from '@mui/material'
import { useContext } from 'react'
import PermissionsContext from '@ors/contexts/PermissionsContext'

const ProjectIdentifiersSection = ({
  projectData,
  setProjectData,
  areNextSectionsDisabled,
  ...rest
}: ProjectIdentifiersSectionProps) => {
  const { canViewBp } = useContext(PermissionsContext)

  return (
    <>
      <ProjectIdentifiersFields
        {...{ projectData, setProjectData, areNextSectionsDisabled }}
        {...rest}
      />
      {canViewBp && (
        <>
          <Divider className="my-6" />
          <ProjectBPLinking
            {...{
              projectData,
              setProjectData,
            }}
            isDisabled={areNextSectionsDisabled}
          />
        </>
      )}
    </>
  )
}

export default ProjectIdentifiersSection
