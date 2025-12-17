import { useContext } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import {
  detailItem,
  numberDetailItem,
  dateDetailItem,
} from '../../ProjectView/ViewHelperComponents'
import { viewColumnsClassName } from '../../constants'
import { enterpriseFieldsMapping } from '../constants'
import { EnterpriseOverview } from '../../interfaces'
import { getEntityById } from '../utils'

const PEnterpriseOverviewSection = ({
  enterprise,
}: {
  enterprise: EnterpriseOverview
}) => {
  const { countries, sectors, subsectors } = useContext(ProjectsDataContext)
  const country = getEntityById(countries, enterprise.country)?.name
  const sector = getEntityById(sectors, enterprise.sector)?.name
  const subsector = getEntityById(subsectors, enterprise.subsector)?.name

  return (
    <>
      <div className="flex flex-col gap-4">
        {detailItem(enterpriseFieldsMapping.name, enterprise.name)}
        {detailItem(enterpriseFieldsMapping.country, country)}
        {detailItem(enterpriseFieldsMapping.location, enterprise.location)}
        {detailItem(enterpriseFieldsMapping.stage, enterprise.stage)}
        <div className={viewColumnsClassName}>
          {detailItem(enterpriseFieldsMapping.sector, sector)}
          {detailItem(enterpriseFieldsMapping.subsector, subsector)}
        </div>
        {detailItem(
          enterpriseFieldsMapping.application,
          enterprise.application,
        )}
        <div className={viewColumnsClassName}>
          {numberDetailItem(
            enterpriseFieldsMapping.local_ownership,
            enterprise.local_ownership as string,
            'decimal',
          )}
          {numberDetailItem(
            enterpriseFieldsMapping.export_to_non_a5,
            enterprise.export_to_non_a5 as string,
            'decimal',
          )}
        </div>
        <div className={viewColumnsClassName}>
          {/* {numberDetailItem(
              enterpriseFieldsMapping.revision,
              enterprise.revision as string,
              'integer',
            )} */}
          {dateDetailItem(
            enterpriseFieldsMapping.date_of_revision,
            enterprise.date_of_revision as string,
          )}
        </div>
      </div>
    </>
  )
}

export default PEnterpriseOverviewSection
