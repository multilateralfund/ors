import { numberDetailItem } from '../../ProjectView/ViewHelperComponents'
import { tableColumns, viewColumnsClassName } from '../../constants'
import { EnterpriseType } from '../../interfaces'

const PEnterpriseFundingDetailsSection = ({
  enterprise,
}: {
  enterprise: EnterpriseType
}) => {
  const funds_approved =
    Number(enterprise.capital_cost_approved ?? 0) +
    Number(enterprise.operating_cost_approved ?? 0)
  const cost_effectiveness_approved = 0

  return (
    <>
      <div className="mt-4 flex w-full flex-col gap-4">
        <div className={viewColumnsClassName}>
          {numberDetailItem(
            tableColumns.capital_cost_approved + ' (US $)',
            enterprise.capital_cost_approved as string,
          )}
          {numberDetailItem(
            tableColumns.operating_cost_approved + ' (US $)',
            enterprise.operating_cost_approved as string,
          )}
        </div>
      </div>
      <div className="mt-4 flex w-full flex-col gap-4">
        <div className={viewColumnsClassName}>
          {numberDetailItem(
            tableColumns.funds_approved + ' (US $)',
            funds_approved.toString(),
          )}
          {numberDetailItem(
            tableColumns.cost_effectiveness_approved + ' (US $/kg)',
            cost_effectiveness_approved.toString(),
          )}
        </div>
      </div>
      <div className="mt-4"></div>
      {numberDetailItem(
        tableColumns.funds_disbursed + ' (US $)',
        enterprise.funds_disbursed as string,
      )}
    </>
  )
}

export default PEnterpriseFundingDetailsSection
