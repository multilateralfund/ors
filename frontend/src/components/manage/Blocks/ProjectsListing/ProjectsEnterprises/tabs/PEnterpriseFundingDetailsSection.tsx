import { useContext } from 'react'

import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { FormattedNumberInput } from '../../../Replenishment/Inputs'
import { getFieldDefaultProps, handleChangeNumericValues } from '../utils'
import { tableColumns } from '../../constants'
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

  const sectionId = 'funding_details'
  const sectionData: EnterpriseFundingDetails = enterpriseData[sectionId]

  return (
    <div className="flex flex-wrap gap-x-20 gap-y-3">
      {map(keys(sectionData), (field) => (
        <div>
          <Label>{tableColumns[field]} (US $)</Label>
          <FormattedNumberInput
            id={field}
            disabled={isDisabled}
            withoutDefaultValue={true}
            prefix={'$'}
            value={
              (sectionData[
                field as keyof EnterpriseFundingDetails
              ] as string) ?? ''
            }
            onChange={(event) =>
              handleChangeNumericValues<PEnterpriseData>(
                field,
                setEnterpriseData,
                event,
                sectionId,
              )
            }
            {...getFieldDefaultProps(hasSubmitted, errors[field], isDisabled)}
          />
        </div>
      ))}
    </div>
  )
}

export default PEnterpriseFundingDetailsSection
