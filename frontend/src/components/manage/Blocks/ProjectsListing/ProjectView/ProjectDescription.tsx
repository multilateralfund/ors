import { detailItem } from './ViewHelperComponents'
import { blanketOrIndConsiderationOpts, tableColumns } from '../constants'
import { ProjectViewProps } from '../interfaces'

import { find } from 'lodash'

const ProjectDescription = ({ project }: ProjectViewProps) => {
  const individual_consideration =
    find(blanketOrIndConsiderationOpts, {
      value: project.individual_consideration,
    })?.name || '-'

  return (
    <div className="flex w-full flex-col gap-4">
      {detailItem(tableColumns.title, project.title)}
      {detailItem(tableColumns.description, project.description, 'self-start')}
      {/* {detailItem(
        tableColumns.individual_consideration,
        individual_consideration,
      )} */}
    </div>
  )
}

export default ProjectDescription
