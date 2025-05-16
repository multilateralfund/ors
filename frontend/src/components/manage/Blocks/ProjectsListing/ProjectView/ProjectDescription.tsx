import { detailItem } from './ViewHelperComponents'
import { blanketOrIndConsiderationOpts, tableColumns } from '../constants'
import { BooleanOptionsType, ProjectTypeApi } from '../interfaces'

import { find } from 'lodash'

const ProjectDescription = ({ project }: { project: ProjectTypeApi }) => {
  const individual_consideration = find(blanketOrIndConsiderationOpts, {
    id: project.individual_consideration,
  }) as BooleanOptionsType

  return (
    <div className="flex w-full flex-col gap-4">
      {detailItem(tableColumns.title, project.title)}
      {detailItem(tableColumns.description, project.description, 'self-start')}
      {/* {detailItem(
        tableColumns.individual_consideration,
        individual_consideration?.name,
      )} */}
    </div>
  )
}

export default ProjectDescription
