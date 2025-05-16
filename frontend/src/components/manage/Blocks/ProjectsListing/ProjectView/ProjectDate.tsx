import { dateDetailItem } from './ViewHelperComponents'
import { ProjectTypeApi } from '../interfaces'
import { tableColumns } from '../constants'

const ProjectDate = ({ project }: { project: ProjectTypeApi }) => {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {dateDetailItem(
          tableColumns.project_start_date,
          project.project_start_date,
        )}
        {dateDetailItem(
          tableColumns.project_end_date,
          project.project_end_date,
        )}
      </div>
    </div>
  )
}

export default ProjectDate
