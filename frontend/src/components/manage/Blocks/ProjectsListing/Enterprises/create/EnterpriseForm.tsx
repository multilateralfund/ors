import { useContext } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import {
  textFields,
  dateFields,
  integerFields,
  decimalFields,
} from '../../ProjectsEnterprises/constants'
import {
  EnterpriseTextField,
  EnterpriseNumberField,
  EnterpriseSelectField,
  EnterpriseDateField,
} from '../../ProjectsEnterprises/FormHelperComponents'
import useGetEnterpriseFieldsOpts from '../../hooks/useGetEnterpriseFieldsOpts'
import { EnterpriseDataProps, EnterpriseOverview } from '../../interfaces'

import { map } from 'lodash'

const EnterpriseForm = (props: EnterpriseDataProps) => {
  const { enterprise, enterpriseData, setEnterpriseData } = props

  const { canEditEnterprise } = useContext(PermissionsContext)
  const { countries } = useContext(ProjectsDataContext)

  const { sectors, subsectors } =
    useGetEnterpriseFieldsOpts<EnterpriseOverview>(
      enterpriseData,
      setEnterpriseData,
    )

  const selectFields = [
    { fieldName: 'country', options: countries },
    { fieldName: 'sector', options: sectors },
    { fieldName: 'subsector', options: subsectors },
  ]

  const isDisabled =
    !!enterprise && (enterprise.status === 'Obsolete' || !canEditEnterprise)

  return (
    <div className="flex flex-col gap-y-2">
      <EnterpriseTextField<EnterpriseOverview, EnterpriseOverview>
        field={textFields[0]}
        {...{ isDisabled, ...props }}
      />
      <EnterpriseSelectField<EnterpriseOverview, EnterpriseOverview>
        field={selectFields[0]}
        {...{ isDisabled, ...props }}
      />
      <EnterpriseTextField<EnterpriseOverview, EnterpriseOverview>
        field={textFields[1]}
        {...{ isDisabled, ...props }}
      />
      <EnterpriseTextField<EnterpriseOverview, EnterpriseOverview>
        field={textFields[2]}
        {...{ isDisabled, ...props }}
      />
      <div className="flex flex-wrap gap-x-20 gap-y-2">
        {map(selectFields.slice(1), (field) => (
          <EnterpriseSelectField<EnterpriseOverview, EnterpriseOverview>
            {...{ field, isDisabled, ...props }}
          />
        ))}
      </div>
      <EnterpriseTextField<EnterpriseOverview, EnterpriseOverview>
        field={textFields[3]}
        {...{ isDisabled, ...props }}
      />
      <div className="flex flex-wrap gap-x-20 gap-y-2">
        {map(decimalFields, (field) => (
          <EnterpriseNumberField<EnterpriseOverview, EnterpriseOverview>
            dataType="decimal"
            {...{ field, isDisabled, ...props }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-20 gap-y-2">
        {/* <EnterpriseNumberField<EnterpriseOverview, EnterpriseOverview>
          dataType="integer"
          field={integerFields[0]}
          {...{ isDisabled, ...props }}
        /> */}
        <EnterpriseDateField<EnterpriseOverview, EnterpriseOverview>
          field={dateFields[0]}
          {...{ isDisabled, ...props }}
        />
      </div>
    </div>
  )
}

export default EnterpriseForm
