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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-x-20 gap-y-4">
        {map(keys(sectionData).slice(0, 3), (field) => (
          <div className="w-[250px]">
            <EnterpriseNumberField<PEnterpriseData, EnterpriseFundingDetails>
              enterpriseData={enterpriseData.funding_details}
              prefix="$"
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
      <div className="flex flex-wrap gap-x-20 gap-y-4">
        {map(keys(sectionData).slice(3, 5), (field) => (
          <div className="w-[250px]">
            <EnterpriseNumberField<PEnterpriseData, EnterpriseFundingDetails>
              enterpriseData={enterpriseData.funding_details}
              prefix={field === 'funds_approved' ? '$' : ''}
              dataType="decimal"
              isDisabled={true}
              {...{
                setEnterpriseData,
                sectionIdentifier,
                field,
                hasSubmitted,
                errors,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default PEnterpriseFundingDetailsSection
