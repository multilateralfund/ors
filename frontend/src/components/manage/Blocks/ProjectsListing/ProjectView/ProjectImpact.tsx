import { numberDetailItem } from './ViewHelperComponents'

const ProjectImpact = ({ project }: any) => {
  const { data } = project

  return (
    <div className="flex w-full flex-col gap-4 opacity-100">
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {numberDetailItem('Impact', data.impact)}
        {numberDetailItem('Impact CO₂MT', data.impact_co2mt)}
        {numberDetailItem('Impact production', data.impact_production)}
        {numberDetailItem('Impact production CO₂MT', data.impact_prod_co2mt)}
      </div>
    </div>
  )
}

export default ProjectImpact
