import { detailItem, viewModesHandler } from './ViewHelperComponents'
import { lvcNonLvcOpts, tableColumns } from '../constants'
import { ProjectViewProps } from '../interfaces'
import { getSectionFields } from '../utils'

import { find, map } from 'lodash'

const ProjectOverview = ({ project, specificFields }: ProjectViewProps) => {
  const fields = getSectionFields(specificFields, 'Header')

  const is_lvc = find(lvcNonLvcOpts, { id: project.is_lvc })?.name || '-'
  const subsectors = map(project.subsectors, 'name').join(', ')

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {detailItem(tableColumns.country, project.country)}
        {detailItem(tableColumns.meeting, project.meeting)}
        {detailItem(tableColumns.agency, project.agency)}
        {detailItem(tableColumns.cluster, project.cluster?.name)}
        {detailItem(tableColumns.is_lvc, is_lvc)}
        {detailItem(tableColumns.type, project.project_type?.name)}
        {detailItem(tableColumns.sector, project.sector?.name)}
        {detailItem(tableColumns.subsectors, subsectors)}
        {map(fields, (field) =>
          viewModesHandler[field.data_type](project, field),
        )}
      </div>
    </div>
  )
}

export default ProjectOverview
