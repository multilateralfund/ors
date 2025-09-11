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
  postExComUpdate,
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

  const { country, agency, cluster } = projectData.projIdentifiers
  const bpKey = country + '-' + agency + '-' + cluster

  const canViewBpSection =
    canViewBp && canViewField(viewableFields, 'bp_activity')

  return (
    <>
      {hasIdentifiers && (
        <ProjectIdentifiersFields
          {...{
            projectData,
            setProjectData,
            areNextSectionsDisabled,
            postExComUpdate,
          }}
          {...rest}
        />
      )}
      {hasIdentifiers && canViewBpSection && <Divider className="my-6" />}
      {canViewBpSection && (
        <ProjectBPLinking
          key={bpKey}
          {...{
            projectData,
            setProjectData,
          }}
          isDisabled={
            postExComUpdate ||
            areNextSectionsDisabled ||
            !canEditField(editableFields, 'bp_activity')
          }
        />
      )}
    </>
  )
}

export default ProjectIdentifiersSection
