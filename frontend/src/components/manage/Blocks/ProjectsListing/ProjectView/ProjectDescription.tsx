import { detailItem } from './ViewHelperComponents'
import { blanketOrIndConsiderationOpts, tableColumns } from '../constants'

import { find } from 'lodash'

const ProjectDescription = ({ project }: any) => {
  const { data } = project

  const individual_consideration =
    find(blanketOrIndConsiderationOpts, {
      value: data.individual_consideration,
    })?.name || '-'

  return (
    <div className="flex w-full flex-col gap-4">
      {detailItem(tableColumns.title, data.title)}
      {detailItem(tableColumns.description, data.description, 'self-start')}
      {detailItem(
        tableColumns.individual_consideration,
        individual_consideration,
      )}
    </div>
  )
}

export default ProjectDescription
