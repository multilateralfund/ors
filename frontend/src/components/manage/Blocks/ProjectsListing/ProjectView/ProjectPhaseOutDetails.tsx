import { numberDetailItem } from './ViewHelperComponents'

const ProjectPhaseOutDetails = ({ project }: any) => {
  const { data } = project

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {numberDetailItem('ODS phasedout CO₂MT', data.ods_phasedout_co2mt)}
        {numberDetailItem('Substance phasedout', data.substance_phasedout)}
      </div>
    </div>
  )
}

export default ProjectPhaseOutDetails
