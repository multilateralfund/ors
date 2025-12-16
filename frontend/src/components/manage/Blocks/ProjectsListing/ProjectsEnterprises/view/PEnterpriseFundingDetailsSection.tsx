import { numberDetailItem } from '../../ProjectView/ViewHelperComponents'
import { getCostEffectivenessApproved, getFundsApproved } from '../utils'
import { viewColumnsClassName } from '../../constants'
import { enterpriseFieldsMapping } from '../constants'
import { PEnterpriseType } from '../../interfaces'

const PEnterpriseFundingDetailsSection = ({
  enterprise,
}: {
  enterprise: PEnterpriseType
}) => {
  const { ods_odp, capital_cost_approved, operating_cost_approved } = enterprise
  const costEffectivenessApproved = getCostEffectivenessApproved(
    ods_odp,
    capital_cost_approved,
    operating_cost_approved,
  )
  const funds_approved = getFundsApproved(
    capital_cost_approved,
    operating_cost_approved,
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full flex-col gap-4">
        <div className={viewColumnsClassName}>
          {numberDetailItem(
            enterpriseFieldsMapping.capital_cost_approved,
            enterprise.capital_cost_approved as string,
            'decimal',
          )}
          {numberDetailItem(
            enterpriseFieldsMapping.operating_cost_approved,
            enterprise.operating_cost_approved as string,
            'decimal',
          )}
          {numberDetailItem(
            enterpriseFieldsMapping.funds_disbursed,
            enterprise.funds_disbursed as string,
            'decimal',
          )}
        </div>
      </div>
      <div className="flex w-full flex-col gap-4">
        <div className={viewColumnsClassName}>
          {numberDetailItem(
            enterpriseFieldsMapping.funds_approved,
            funds_approved?.toString() as string,
            'decimal',
          )}
          {numberDetailItem(
            enterpriseFieldsMapping.cost_effectiveness_approved,
            costEffectivenessApproved?.toString() as string,
            'decimal',
          )}
        </div>
      </div>
    </div>
  )
}

export default PEnterpriseFundingDetailsSection
