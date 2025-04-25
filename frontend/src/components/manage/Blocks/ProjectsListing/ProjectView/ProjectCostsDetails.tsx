import { numberDetailItem } from './ViewHelperComponents'

const ProjectCostsDetails = ({ project }: any) => {
  const { data } = project

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {numberDetailItem('Capital cost', data.capital_cost)}
        {numberDetailItem('Operating cost', data.operating_cost)}
        {numberDetailItem('Effectiveness cost', data.effectiveness_cost)}
        {numberDetailItem('Contingency cost', data.contingency_cost)}
        {numberDetailItem('Total PSC cost', data.total_psc_cost)}
        {numberDetailItem('Support cost PSC', data.support_cost_psc)}
        {numberDetailItem('Project cost', data.project_cost)}
      </div>
    </div>
  )
}

export default ProjectCostsDetails
