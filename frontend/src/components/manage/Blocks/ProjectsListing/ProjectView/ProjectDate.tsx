import { dateDetailItem } from './ViewHelperComponents'
import { tableColumns } from '../constants'

const ProjectDate = ({ project }: any) => {
  const { data } = project

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {dateDetailItem(
          tableColumns.project_start_date,
          data.project_start_date,
        )}
        {dateDetailItem(tableColumns.project_end_date, data.project_end_date)}
      </div>
    </div>
  )
}

export default ProjectDate
