import { useContext } from 'react'

import { ProjectIdentifiersSectionProps } from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ProjectIdentifiersFields from './ProjectIdentifiersFields'
import ProjectBPLinking from './ProjectBPLinking'
import { canEditField, canViewField, hasFields } from '../utils'
import { useStore } from '@ors/store'

import { Divider } from '@mui/material'

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

  const hasIdentifiers = hasFields(
    projectFields,
    viewableFields,
    'Identifiers',
    false,
    ['bp_activity'],
  )
  const canViewBpSection =
    canViewBp && canViewField(viewableFields, 'bp_activity')

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
            areNextSectionsDisabled ||
            !canEditField(editableFields, 'bp_activity')
          }
        />
      )}
    </>
  )
}

export default ProjectIdentifiersSection
