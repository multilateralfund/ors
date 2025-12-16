import { numberDetailItem } from '../../ProjectView/ViewHelperComponents'
import { tableColumns, viewColumnsClassName } from '../../constants'
import { PEnterpriseType } from '../../interfaces'

import { sumBy, isNaN, isNil } from 'lodash'

const PEnterpriseFundingDetailsSection = ({
  enterprise,
}: {
  enterprise: PEnterpriseType
}) => {
  const funds_approved =
    isNil(enterprise.capital_cost_approved) &&
    isNil(enterprise.operating_cost_approved)
      ? null
      : Number(enterprise.capital_cost_approved ?? 0) +
        Number(enterprise.operating_cost_approved ?? 0)
  const totalPhaseOut = sumBy(
    enterprise.ods_odp,
    ({ consumption }) => Number(consumption) || 0,
  )
  const cost_effectiveness_approved =
    !isNil(funds_approved) && totalPhaseOut
      ? (funds_approved ?? 0) / (totalPhaseOut * 1000)
      : null
  const formattedCostEffectivenessApproved = !isNaN(cost_effectiveness_approved)
    ? cost_effectiveness_approved
    : null

  return (
    <>
      <div className="flex w-full flex-col gap-4">
        <div className={viewColumnsClassName}>
          {numberDetailItem(
            tableColumns.capital_cost_approved + ' (US $)',
            enterprise.capital_cost_approved as string,
            'decimal',
          )}
          {numberDetailItem(
            tableColumns.operating_cost_approved + ' (US $)',
            enterprise.operating_cost_approved as string,
            'decimal',
          )}
        </div>
      </div>
      <div className="mt-4 flex w-full flex-col gap-4">
        <div className={viewColumnsClassName}>
          {numberDetailItem(
            tableColumns.funds_approved + ' (US $)',
            funds_approved?.toString() as string,
            'decimal',
          )}
          {numberDetailItem(
            tableColumns.cost_effectiveness_approved + ' (US $/kg)',
            formattedCostEffectivenessApproved?.toString() as string,
            'decimal',
          )}
        </div>
      </div>
      <div className="mt-4"></div>
      {numberDetailItem(
        tableColumns.funds_disbursed + ' (US $)',
        enterprise.funds_disbursed as string,
        'decimal',
      )}
    </>
  )
}

export default PEnterpriseFundingDetailsSection
