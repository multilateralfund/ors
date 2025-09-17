import { useContext } from 'react'

import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import PermissionsContext from '@ors/contexts/PermissionsContext'
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
  enterprise,
  hasSubmitted,
  errors = {},
}: PEnterpriseDataProps) => {
  const { canEditProjectEnterprise } = useContext(PermissionsContext)

  const sectionId = 'funding_details'
  const sectionData: EnterpriseFundingDetails = enterpriseData[sectionId]

  const isDisabled =
    !!enterprise &&
    (enterprise.status !== 'Pending Approval' || !canEditProjectEnterprise)

  return (
    <div className="flex flex-wrap gap-x-20 gap-y-3">
      {map(keys(sectionData), (field) => (
        <div>
          <Label>{tableColumns[field]} (US $)</Label>
          <SimpleInput
            id={field}
            disabled={isDisabled}
            value={sectionData[field as keyof EnterpriseFundingDetails] ?? ''}
            onChange={(event) =>
              handleChangeNumericValues<PEnterpriseData>(
                field,
                setEnterpriseData,
                event,
                sectionId,
              )
            }
            type="text"
            {...getFieldDefaultProps(hasSubmitted, errors[field], isDisabled)}
          />
        </div>
      ))}
    </div>
  )
}

export default PEnterpriseFundingDetailsSection
