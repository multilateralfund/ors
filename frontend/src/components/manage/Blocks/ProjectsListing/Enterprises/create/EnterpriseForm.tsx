import { useContext } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import {
  EnterpriseTextField,
  EnterpriseNumberField,
  EnterpriseSelectField,
  EnterpriseTextAreaField,
} from '../../ProjectsEnterprises/FormHelperComponents'
import { EnterpriseDataProps, EnterpriseOverview } from '../../interfaces'
import { useStore } from '@ors/store'

import { map } from 'lodash'

const EnterpriseForm = (props: EnterpriseDataProps) => {
  const { canEditEnterprise } = useContext(PermissionsContext)

  const commonSlice = useStore((state) => state.common)
  const countries = commonSlice.countries.data
  const agencies = commonSlice.agencies.data

  const textFields = ['name', 'location', 'application']
  const numericFields = ['local_ownership', 'export_to_non_a5']
  const selectFields = [
    { fieldName: 'agencies', options: agencies },
    { fieldName: 'country', options: countries },
  ]

  const { enterprise } = props
  const isDisabled =
    !!enterprise &&
    (enterprise.status !== 'Pending Approval' || !canEditEnterprise)

  return (
    <>
      <EnterpriseTextField<EnterpriseOverview>
        field={textFields[0]}
        {...{ isDisabled, ...props }}
      />
      {map(selectFields, (field) => (
        <EnterpriseSelectField<EnterpriseOverview>
          {...{ field, isDisabled, ...props }}
        />
      ))}
      {map(textFields.slice(1), (field) => (
        <EnterpriseTextField<EnterpriseOverview>
          {...{ field, isDisabled, ...props }}
        />
      ))}
      <div className="mt-6 flex flex-wrap gap-x-20 gap-y-3">
        {map(numericFields, (field) => (
          <EnterpriseNumberField<EnterpriseOverview>
            {...{ field, isDisabled, ...props }}
          />
        ))}
      </div>
      <div className="mt-6">
        <EnterpriseTextAreaField<EnterpriseOverview>
          field="remarks"
          {...{ isDisabled, ...props }}
        />
      </div>
    </>
  )
}

export default EnterpriseForm
