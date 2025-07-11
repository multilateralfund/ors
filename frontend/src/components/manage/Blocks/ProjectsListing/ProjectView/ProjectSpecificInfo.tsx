import { SectionTitle } from '../ProjectsCreate/ProjectsCreate'
import ProjectOdsOdpTable from './ProjectOdsOdpTable'
import { viewModesHandler } from './ViewHelperComponents'
import { ProjectViewProps } from '../interfaces'
import { getSectionFields } from '../utils'

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

  return (
    <>
      {headerFields.length > 0 && (
        <>
          <SectionTitle>Overview</SectionTitle>
          <div className="flex w-full flex-col gap-4">
            <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
              {map(headerFields, (field) =>
                viewModesHandler[field.data_type](project, field),
              )}
            </div>
          </div>
        </>
      )}

      {headerFields.length > 0 && substanceFields.length > 0 && (
        <Divider className="my-6" />
      )}

      {substanceFields.length > 0 && (
        <>
          <SectionTitle>Substance Details</SectionTitle>
          <div className="flex w-full flex-col gap-4">
            <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
              {map(projectFields, (field) =>
                viewModesHandler[field.data_type](project, field),
              )}
            </div>
            {odsOdpFields.length > 0 && (
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
