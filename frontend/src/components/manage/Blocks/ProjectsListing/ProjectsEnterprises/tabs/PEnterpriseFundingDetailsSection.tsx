import { useContext } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import { EnterpriseNumberField } from '../FormHelperComponents'
import {
  PEnterpriseDataProps,
  EnterpriseFundingDetails,
  PEnterpriseData,
} from '../../interfaces'

import { keys, map } from 'lodash'

const PEnterpriseFundingDetailsSection = ({
  enterpriseData,
  setEnterpriseData,
  hasSubmitted,
  errors = {},
}: PEnterpriseDataProps) => {
  const { canEditProjectEnterprise } = useContext(PermissionsContext)
  const isDisabled = !canEditProjectEnterprise

  const sectionIdentifier = 'funding_details'
  const sectionData = enterpriseData[sectionIdentifier]

  const fields = [
    {
      slice: [0, 3],
      width: 'w-[250px]',
      getPrefix: () => '$',
      isDisabled,
    },
    {
      slice: [3, 5],
      getWidth: (field: string) =>
        field === 'funds_approved' ? 'w-[250px]' : '',
      getPrefix: (field: string) => (field === 'funds_approved' ? '$' : ''),
      isDisabled: true,
    },
    {
      slice: [5, 7],
      width: 'w-[250px]',
      getPrefix: (field: string) =>
        field !== 'cost_effectiveness_actual' ? '$' : '',
      isDisabled,
    },
    {
      slice: [7, 9],
      width: 'w-[250px]',
      getPrefix: () => '$',
      isDisabled,
    },
    {
      slice: [9, 11],
      width: 'w-[250px]',
      getPrefix: () => '$',
      isDisabled,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {fields.map(({ slice, width, getWidth, getPrefix, isDisabled }, idx) => (
        <div key={idx} className="flex flex-wrap gap-x-20 gap-y-4">
          {map(keys(sectionData).slice(...slice), (field) => (
            <div key={field} className={getWidth ? getWidth(field) : width}>
              <EnterpriseNumberField<PEnterpriseData, EnterpriseFundingDetails>
                enterpriseData={enterpriseData.funding_details}
                prefix={getPrefix(field)}
                dataType="decimal"
                {...{
                  setEnterpriseData,
                  sectionIdentifier,
                  field,
                  isDisabled,
                  hasSubmitted,
                  errors,
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default PEnterpriseFundingDetailsSection
