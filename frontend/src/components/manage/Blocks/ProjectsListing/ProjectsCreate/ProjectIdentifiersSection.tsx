import { useContext } from 'react'

import { ProjectIdentifiersSectionProps } from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ProjectIdentifiersFields from './ProjectIdentifiersFields'
import ProjectBPLinking from './ProjectBPLinking'
import { hasIdentifierFields } from '../utils'
import { useStore } from '@ors/store'

import { Divider } from '@mui/material'
import { isArray } from 'lodash'

const ProjectIdentifiersSection = ({
  projectData,
  setProjectData,
  areNextSectionsDisabled,
  ...rest
}: ProjectIdentifiersSectionProps) => {
  const { canViewBp } = useContext(PermissionsContext)

  const { projectFields, viewableFields, editableFields } = useStore(
    (state) => state.projectFields,
  )
  const allFields = isArray(projectFields) ? projectFields : projectFields?.data
  const hasIdentifiers = hasIdentifierFields(allFields, viewableFields, false)
  const canViewBpSection = canViewBp && viewableFields.includes('bp_activity')

  return (
    <>
      {hasIdentifiers && (
        <ProjectIdentifiersFields
          {...{ projectData, setProjectData, areNextSectionsDisabled }}
          {...rest}
        />
      )}
      {hasIdentifiers && canViewBpSection && <Divider className="my-6" />}
      {canViewBpSection && (
        <ProjectBPLinking
          {...{
            projectData,
            setProjectData,
          }}
          isDisabled={
            areNextSectionsDisabled || !editableFields.includes('bp_activity')
          }
        />
      )}
    </>
  )
}

export default ProjectIdentifiersSection
