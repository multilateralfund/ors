import { detailItem } from './ViewHelperComponents'
import { tableColumns } from '../constants'

import { isNil } from 'lodash'

const ProjectDescription = ({ project }: any) => {
  const { data } = project

  const individual_consideration = !isNil(data.individual_consideration)
    ? data.individual_consideration
      ? 'Individual'
      : 'Blanket'
    : '-'

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
