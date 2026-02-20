import { useContext } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import { EnterpriseTextAreaField } from '../FormHelperComponents'
import { remarksFields } from '../constants'
import {
  PEnterpriseDataProps,
  PEnterpriseData,
  EnterpriseRemarks,
} from '../../interfaces'

import { map } from 'lodash'

const PEnterpriseRemarksSection = ({
  enterpriseData,
  setEnterpriseData,
  errors,
}: PEnterpriseDataProps) => {
  const { canEditProjectEnterprise } = useContext(PermissionsContext)
  const isDisabled = !canEditProjectEnterprise

  const sectionIdentifier = 'remarks'

  return (
    <div className="flex max-w-[41rem] flex-col gap-y-2">
      {map(remarksFields, (field) => (
        <EnterpriseTextAreaField<PEnterpriseData, EnterpriseRemarks>
          enterpriseData={enterpriseData.remarks}
          {...{
            setEnterpriseData,
            sectionIdentifier,
            field,
            isDisabled,
            errors,
          }}
        />
      ))}
    </div>
  )
}

export default PEnterpriseRemarksSection
