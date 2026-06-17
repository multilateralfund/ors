import { numberDetailItem } from '../../ProjectView/ViewHelperComponents'
import { enterpriseFieldsMapping } from '../constants'
import { viewColumnsClassName } from '../../constants'
import { EnterpriseType } from '../interfaces'

const EnterpriseFundingDetailsSection = ({
  enterprise,
}: {
  enterprise: EnterpriseType
}) => {
  const fields = [
    [
      {
        label: enterpriseFieldsMapping.capital_cost_approved,
        value: enterprise.capital_cost_approved,
      },
      {
        label: enterpriseFieldsMapping.operating_cost_approved,
        value: enterprise.operating_cost_approved,
      },
    ],
    [
      {
        label: enterpriseFieldsMapping.funds_approved,
        value: enterprise.funds_approved,
      },
      {
        label: enterpriseFieldsMapping.cost_effectiveness_approved,
        value: enterprise.cost_effectiveness_approved,
      },
      {
        label: enterpriseFieldsMapping.cost_effectiveness_actual,
        value: enterprise.cost_effectiveness_actual,
      },
    ],
    [
      {
        label: enterpriseFieldsMapping.funds_disbursed,
        value: enterprise.funds_disbursed,
      },
      {
        label: enterpriseFieldsMapping.funds_transferred,
        value: enterprise.funds_transferred,
      },
    ],
    [
      {
        label: enterpriseFieldsMapping.capital_cost_disbursed,
        value: enterprise.capital_cost_disbursed,
      },
      {
        label: enterpriseFieldsMapping.operating_cost_disbursed,
        value: enterprise.operating_cost_disbursed,
      },
    ],
    [
      {
        label: enterpriseFieldsMapping.co_financing_planned,
        value: enterprise.co_financing_planned,
      },
      {
        label: enterpriseFieldsMapping.co_financing_actual,
        value: enterprise.co_financing_actual,
      },
    ],
  ]

  return (
    <div className="flex flex-col gap-4">
      {fields.map((field, index) => (
        <div key={index} className="flex w-full flex-col gap-4">
          <div className={viewColumnsClassName}>
            {field.map(({ label, value }, fieldIndex) => (
              <div key={fieldIndex}>
                {numberDetailItem(label, value as string, 'decimal')}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default EnterpriseFundingDetailsSection
