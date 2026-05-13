import { numberDetailItem } from '../../ProjectView/ViewHelperComponents'
import { enterpriseFieldsMapping } from '../constants'
import { viewColumnsClassName } from '../../constants'
import { EnterpriseType } from '../interfaces'

import { replace } from 'lodash'

const EnterpriseFundingDetailsSection = ({
  enterprise,
}: {
  enterprise: EnterpriseType
}) => {
  const formatFieldName = (fieldName: string) =>
    replace(fieldName, ' (computed)', '')

  const fields = [
    [
      [
        enterpriseFieldsMapping.capital_cost_approved,
        enterprise.capital_cost_approved,
      ],
      [
        enterpriseFieldsMapping.operating_cost_approved,
        enterprise.operating_cost_approved,
      ],
    ],
    [
      [
        formatFieldName(enterpriseFieldsMapping.funds_approved),
        enterprise.funds_approved,
      ],
      [
        formatFieldName(enterpriseFieldsMapping.cost_effectiveness_approved),
        enterprise.cost_effectiveness_approved,
      ],
      [
        enterpriseFieldsMapping.cost_effectiveness_actual,
        enterprise.cost_effectiveness_actual,
      ],
    ],
    [
      [enterpriseFieldsMapping.funds_disbursed, enterprise.funds_disbursed],
      [enterpriseFieldsMapping.funds_transferred, enterprise.funds_transferred],
    ],
    [
      [
        enterpriseFieldsMapping.capital_cost_disbursed,
        enterprise.capital_cost_disbursed,
      ],
      [
        enterpriseFieldsMapping.operating_cost_disbursed,
        enterprise.operating_cost_disbursed,
      ],
    ],
    [
      [
        enterpriseFieldsMapping.co_financing_planned,
        enterprise.co_financing_planned,
      ],
      [
        enterpriseFieldsMapping.co_financing_actual,
        enterprise.co_financing_actual,
      ],
    ],
  ]

  return (
    <div className="flex flex-col gap-4">
      {fields.map((field, index) => (
        <div key={index} className="flex w-full flex-col gap-4">
          <div className={viewColumnsClassName}>
            {field.map(([crtField, value], index) => (
              <div key={index}>
                {numberDetailItem(
                  crtField as string,
                  value as string,
                  'decimal',
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default EnterpriseFundingDetailsSection
