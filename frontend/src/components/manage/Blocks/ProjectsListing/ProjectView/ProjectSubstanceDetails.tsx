import ProjectOdsOdpTable from './ProjectOdsOdpTable'
import { detailItem, numberDetailItem } from './ViewHelperComponents'
import { tableColumns } from '../constants'

import { Divider } from '@mui/material'

const ProjectSubstanceDetails = ({ project }: any) => {
  const { data } = project

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {detailItem(
          tableColumns.products_manufactured,
          data.products_manufactured,
          'self-start',
        )}
      </div>
      <span>{tableColumns.ods_odp}</span>
      <ProjectOdsOdpTable data={data.ods_odp || []} />
      <Divider />
      <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
        {detailItem('Substance name', data.substance_name)}
        {detailItem('Substance category', data.substance_category)}
        {detailItem('Substance type', data.substance_type)}
        {numberDetailItem('Substance phasedout', data.substance_phasedout)}
        {numberDetailItem('HCFC stage', data.hcfc_stage)}
      </div>
    </div>
  )
}

export default ProjectSubstanceDetails
