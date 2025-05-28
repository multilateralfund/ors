import ProjectOdsOdpTable from './ProjectOdsOdpTable'
import { viewModesHandler } from './ViewHelperComponents'
import { ProjectViewProps } from '../interfaces'
import { getSectionFields } from '../utils'

import { groupBy, map } from 'lodash'

const ProjectSubstanceDetails = ({
  project,
  specificFields,
}: ProjectViewProps) => {
  const fields = getSectionFields(specificFields, 'Substance Details')
  const field = 'ods_odp'

  const groupedFields = groupBy(fields, 'table')
  const projectFields = groupedFields['project'] || []
  const odsOdpFields = groupedFields[field] || []

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {map(projectFields, (field) =>
          viewModesHandler[field.data_type](project, field),
        )}
      </div>
      <ProjectOdsOdpTable
        data={project?.[field] || []}
        fields={odsOdpFields}
        mode="view"
      />
    </div>
  )
}

export default ProjectSubstanceDetails
