import { detailItem } from './ViewHelperComponents'
import { tableColumns } from '../constants'

const ProjectDescription = ({ project }: any) => {
  const { data } = project

  return (
    <div className="flex w-full flex-col gap-4">
      {detailItem(tableColumns.title, data.title)}
      {detailItem('Description', data.description, 'self-start')}
      {detailItem(
        'Blanket or individual consideration',
        data.blanket_consideration ? 'Blanket' : 'Individual',
      )}
    </div>
  )
}

export default ProjectDescription
