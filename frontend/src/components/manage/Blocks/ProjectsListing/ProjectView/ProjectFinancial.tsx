import { numberDetailItem } from './ViewHelperComponents'
import { ProjectViewProps } from '../interfaces'
import { tableColumns } from '../constants'

const ProjectFinancial = ({ project }: ProjectViewProps) => {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {numberDetailItem(tableColumns.total_fund, project.total_fund)}
        {numberDetailItem(
          tableColumns.support_cost_psc,
          project.support_cost_psc,
        )}
      </div>
    </div>
  )
}

export default ProjectFinancial
