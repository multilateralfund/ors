import { EnterpriseNumberField } from '../FormHelperComponents'
import { EnterpriseFormProps } from '../interfaces'

import { keys, map } from 'lodash'

const EnterpriseFundingDetailsSection = ({
  enterpriseData,
  ...rest
}: EnterpriseFormProps) => {
  const sectionIdentifier = 'funding_details'
  const sectionData = enterpriseData[sectionIdentifier]

  const nonMonetaryFields = [
    'cost_effectiveness_approved',
    'cost_effectiveness_actual',
  ]

  const fields = [
    { slice: [0, 2] },
    {
      slice: [2, 5],
      isDisabled: (field: string) => field !== 'cost_effectiveness_actual',
    },
    { slice: [5, 7] },
    { slice: [7, 9] },
    { slice: [9, 11] },
  ]

  return (
    <div className="flex flex-col gap-2">
      {fields.map(({ slice, isDisabled }, idx) => (
        <div key={idx} className="flex flex-wrap gap-x-20 gap-y-2">
          {map(keys(sectionData).slice(...slice), (field) => (
            <div
              key={field}
              className={
                field !== 'cost_effectiveness_approved'
                  ? 'w-full sm:w-[250px]'
                  : ''
              }
            >
              <EnterpriseNumberField
                dataType="decimal"
                prefix={!nonMonetaryFields.includes(field) ? '$' : ''}
                isDisabled={isDisabled ? isDisabled(field) : false}
                {...{
                  enterpriseData,
                  field,
                  sectionIdentifier,
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
