import { EnterpriseNumberField } from '../../ProjectsEnterprises/FormHelperComponents'
import { EnterpriseDataProps } from '../../interfaces'

import { keys, map } from 'lodash'

const EnterpriseFundingDetailsSection = ({
  enterpriseData,
  ...rest
}: EnterpriseDataProps) => {
  const sectionIdentifier = 'funding_details'
  const sectionData = enterpriseData[sectionIdentifier]

  const nonMonetaryFields = [
    'cost_effectiveness_approved',
    'cost_effectiveness_actual',
  ]

  const fields = [
    { slice: [0, 3] },
    {
      slice: [3, 5],
      getWidth: (field: string) =>
        field === 'funds_approved' ? 'w-[250px]' : '',
      isDisabled: true,
    },
    { slice: [5, 7] },
    { slice: [7, 9] },
    { slice: [9, 11] },
  ]

  return (
    <div className="flex flex-col gap-2">
      {fields.map(({ slice, getWidth, isDisabled }, idx) => (
        <div key={idx} className="flex flex-wrap gap-x-20 gap-y-2">
          {map(keys(sectionData).slice(...slice), (field) => (
            <div
              key={field}
              className={getWidth ? getWidth(field) : 'w-[250px]'}
            >
              <EnterpriseNumberField
                dataType="decimal"
                prefix={!nonMonetaryFields.includes(field) ? '$' : ''}
                {...{
                  enterpriseData,
                  field,
                  sectionIdentifier,
                  isDisabled,
                  ...rest,
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default EnterpriseFundingDetailsSection
