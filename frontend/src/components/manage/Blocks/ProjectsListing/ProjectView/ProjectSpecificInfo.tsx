import { SectionTitle } from '../ProjectsCreate/ProjectsCreate'
import ProjectOdsOdpTable from './ProjectOdsOdpTable'
import { viewModesHandler } from './ViewHelperComponents'
import { canViewField, getSectionFields, hasFields } from '../utils'
import { ProjectViewProps } from '../interfaces'
import { useStore } from '@ors/store'

import { Divider } from '@mui/material'
import { groupBy, map } from 'lodash'

const ProjectSpecificInfo = ({ project, specificFields }: ProjectViewProps) => {
  const headerFields = getSectionFields(specificFields, 'Header')
  const substanceFields = getSectionFields(specificFields, 'Substance Details')

  const field = 'ods_odp'

  const groupedFields = groupBy(substanceFields, 'table')
  const projectFields = groupedFields['project'] || []
  const odsOdpFields = (groupedFields[field] || []).filter(
    (field) => field.read_field_name !== 'sort_order',
  )

  const { projectFields: allFields, viewableFields } = useStore(
    (state) => state.projectFields,
  )

  const canViewOverviewSection =
    headerFields.length > 0 && hasFields(allFields, viewableFields, 'Header')
  const canViewSubstanceDetailsSection =
    substanceFields.length > 0 &&
    hasFields(allFields, viewableFields, 'Substance Details')
  const canViewSubstanceSection = hasFields(
    allFields,
    viewableFields,
    'ods_odp',
    true,
    [],
    'table',
  )

  return (
    <>
      {canViewOverviewSection && (
        <>
          <SectionTitle>Overview</SectionTitle>
          <div className="flex w-full flex-col gap-4">
            <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
              {map(
                headerFields,
                (field) =>
                  canViewField(viewableFields, field.write_field_name) &&
                  viewModesHandler[field.data_type](project, field),
              )}
            </div>
          </div>
        </>
      )}

      {canViewOverviewSection && canViewSubstanceDetailsSection && (
        <Divider className="my-6" />
      )}

      {canViewSubstanceDetailsSection && (
        <>
          <SectionTitle>Substance Details</SectionTitle>
          <div className="flex w-full flex-col gap-4">
            <div className="grid grid-cols-2 gap-y-4 border-0 md:grid-cols-3 lg:grid-cols-4">
              {map(
                projectFields,
                (field) =>
                  canViewField(viewableFields, field.write_field_name) &&
                  viewModesHandler[field.data_type](project, field),
              )}
            </div>
            {canViewSubstanceSection && odsOdpFields.length > 0 && (
              <ProjectOdsOdpTable
                data={project?.[field] || []}
                fields={odsOdpFields}
              />
            )}
          </div>
        </>
      )}
    </>
  )
}

export default ProjectSpecificInfo
