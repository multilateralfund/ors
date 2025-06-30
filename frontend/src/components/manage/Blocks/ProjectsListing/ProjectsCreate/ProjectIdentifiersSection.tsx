import { useContext } from 'react'

import { ProjectIdentifiersSectionProps } from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ProjectIdentifiersFields from './ProjectIdentifiersFields'
import ProjectBPLinking from './ProjectBPLinking'

import { Divider } from '@mui/material'

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
