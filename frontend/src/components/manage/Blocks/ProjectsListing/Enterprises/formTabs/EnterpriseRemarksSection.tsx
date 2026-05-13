import { useContext } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import { EnterpriseTextAreaField } from '../FormHelperComponents'
import { EnterpriseFormProps } from '../interfaces'
import { remarksFields } from '../constants'
import { getIsAgencyUser } from '../utils'
import { useStore } from '@ors/store'

import { map } from 'lodash'

const EnterpriseRemarksSection = (props: EnterpriseFormProps) => {
  const { canViewOnlyOwnAgency } = useContext(PermissionsContext)

  const userSlice = useStore((state) => state.user)
  const { agency_id } = userSlice.data

  const isAgencyUser = getIsAgencyUser(canViewOnlyOwnAgency, agency_id)

  return (
    <div className="flex max-w-[41rem] flex-col gap-y-2">
      {map(remarksFields, (field, index) => (
        <EnterpriseTextAreaField
          key={index}
          sectionIdentifier="remarks"
          isDisabled={
            isAgencyUser
              ? field === 'secretariat_remarks'
              : field === 'agency_remarks'
          }
          {...{ field, ...props }}
        />
      ))}
    </div>
  )
}

export default EnterpriseRemarksSection
