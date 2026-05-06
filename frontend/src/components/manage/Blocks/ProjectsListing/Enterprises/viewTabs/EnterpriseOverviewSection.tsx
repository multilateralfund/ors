import { useContext } from 'react'

import EnterprisesDataContext from '@ors/contexts/Enterprises/EnterprisesDataContext'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { detailItem } from '../../ProjectView/ViewHelperComponents'
import { enterpriseFieldsMapping } from '../constants'
import { viewColumnsClassName } from '../../constants'
import { EnterpriseType } from '../../interfaces'
import { getEntityById } from '../utils'
import { find } from 'lodash'

const EnterpriseOverviewSection = ({
  enterprise,
}: {
  enterprise: EnterpriseType
}) => {
  const { countries, agencies, project_types, sectors, subsectors } =
    useContext(ProjectsDataContext)
  const { statuses } = useContext(EnterprisesDataContext)

  const country = getEntityById(countries, enterprise.country)?.name
  const agency = getEntityById(agencies, enterprise.agency)?.name
  const project_type = getEntityById(
    project_types,
    enterprise.project_type,
  )?.name
  const sector = getEntityById(sectors, enterprise.sector)?.name
  const subsector = getEntityById(subsectors, enterprise.subsector)?.name
  const status =
    find(statuses, (status) => status.id === enterprise.status)?.name ?? ''

  return (
    <div className="flex flex-col gap-4">
      {detailItem(enterpriseFieldsMapping.name, enterprise.name)}
      <div className={viewColumnsClassName}>
        {detailItem(enterpriseFieldsMapping.country, country)}
        {detailItem(enterpriseFieldsMapping.agency, agency)}
      </div>
      {detailItem(enterpriseFieldsMapping.location, enterprise.location)}
      {detailItem(enterpriseFieldsMapping.city, enterprise.city)}
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
