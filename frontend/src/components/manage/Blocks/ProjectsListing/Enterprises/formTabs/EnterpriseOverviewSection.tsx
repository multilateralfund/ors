import { useContext } from 'react'

import EnterprisesDataContext from '@ors/contexts/Enterprises/EnterprisesDataContext'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import {
  EnterpriseTextField,
  EnterpriseNumberField,
  EnterpriseSelectField,
  EnterpriseDateField,
} from '../FormHelperComponents'
import useGetEnterpriseFieldsOpts from '../../hooks/useGetEnterpriseFieldsOpts'
import { EnterpriseDataProps } from '../../interfaces'
import {
  textFields,
  integerFields,
  decimalFields,
  dateFields,
} from '../constants'

import { map } from 'lodash'

const EnterpriseOverviewSection = ({
  mode,
  ...rest
}: EnterpriseDataProps & {
  mode: string
}) => {
  const sectionIdentifier = 'overview'

  const { enterpriseData, setEnterpriseData } = rest

  const { sectors, subsectors } = useGetEnterpriseFieldsOpts(
    enterpriseData,
    setEnterpriseData,
    mode,
  )

  const { countries } = useContext(ProjectsDataContext)
  const { statuses } = useContext(EnterprisesDataContext)

  const selectFields = [
    {
      fieldName: 'country',
      options: countries,
      isDisabled: mode === 'edit',
    },
    { fieldName: 'sector', options: sectors },
    { fieldName: 'subsector', options: subsectors },
    { fieldName: 'status', options: statuses },
  ]

  return (
    <div className="flex flex-col gap-y-2">
      <EnterpriseTextField
        field={textFields[0]}
        {...{ sectionIdentifier, ...rest }}
      />
      <EnterpriseSelectField
        field={selectFields[0]}
        isDisabled={selectFields[0].isDisabled}
        {...{ sectionIdentifier, ...rest }}
      />
      {map(textFields.slice(1, 3), (field, index) => (
        <EnterpriseTextField
          key={index}
          {...{ field, sectionIdentifier, ...rest }}
        />
      ))}
      <div className="flex flex-wrap gap-x-20 gap-y-2">
        {map(selectFields.slice(1, 3), (field, index) => (
          <EnterpriseSelectField
            key={index}
            {...{ sectionIdentifier, field, ...rest }}
          />
        ))}
      </div>
      <EnterpriseTextField
        field={textFields[3]}
        {...{ sectionIdentifier, ...rest }}
      />
      <div className="flex flex-wrap gap-x-20 gap-y-2">
        {map(decimalFields, (field, index) => (
          <EnterpriseNumberField
            key={index}
            dataType="decimal"
            {...{ sectionIdentifier, field, ...rest }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-20 gap-y-2">
        <EnterpriseNumberField
          dataType="integer"
          field={integerFields[0]}
          {...{ sectionIdentifier, ...rest }}
        />
        <EnterpriseDateField
          field={dateFields[0]}
          {...{ sectionIdentifier, ...rest }}
        />
      </div>
      <EnterpriseSelectField
        field={selectFields[3]}
        {...{ sectionIdentifier, ...rest }}
      />
    </div>
  )
}

export default EnterpriseOverviewSection
