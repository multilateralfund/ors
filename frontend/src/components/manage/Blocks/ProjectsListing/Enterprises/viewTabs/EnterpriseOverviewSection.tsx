import { useContext } from 'react'

import EnterprisesDataContext from '@ors/contexts/Enterprises/EnterprisesDataContext'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { detailItem } from '../../ProjectView/ViewHelperComponents'
import { enterpriseFieldsMapping } from '../constants'
import { viewColumnsClassName } from '../../constants'
import { EnterpriseType } from '../interfaces'
import { getEntityNameById } from '../utils'

const EnterpriseOverviewSection = ({
  enterprise,
}: {
  enterprise: EnterpriseType
}) => {
  const { countries, agencies, project_types, sectors, subsectors } =
    useContext(ProjectsDataContext)
  const { statuses } = useContext(EnterprisesDataContext)

  const country = getEntityNameById(countries, enterprise.country)
  const agency = getEntityNameById(agencies, enterprise.agency)
  const project_type = getEntityNameById(project_types, enterprise.project_type)
  const sector = getEntityNameById(sectors, enterprise.sector)
  const subsector = getEntityNameById(subsectors, enterprise.subsector)
  const status = getEntityNameById(statuses, enterprise.status) ?? ''

  return (
    <div className="flex flex-col gap-4">
      {detailItem(enterpriseFieldsMapping.name, enterprise.name)}
      <div className={viewColumnsClassName}>
        {detailItem(enterpriseFieldsMapping.country, country)}
        {detailItem(enterpriseFieldsMapping.agency, agency)}
      </div>
      {detailItem(enterpriseFieldsMapping.city, enterprise.city)}
      {detailItem(enterpriseFieldsMapping.location, enterprise.location)}
      <div className={viewColumnsClassName}>
        {detailItem(enterpriseFieldsMapping.project_type, project_type)}
        {detailItem(enterpriseFieldsMapping.sector, sector)}
        {detailItem(enterpriseFieldsMapping.subsector, subsector)}
      </div>
      {detailItem(enterpriseFieldsMapping.status, status)}
    </div>
  )
}

export default EnterpriseOverviewSection
