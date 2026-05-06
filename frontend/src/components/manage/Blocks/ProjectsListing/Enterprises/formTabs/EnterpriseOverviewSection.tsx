import { useContext } from 'react'

import EnterprisesDataContext from '@ors/contexts/Enterprises/EnterprisesDataContext'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import {
  EnterpriseTextField,
  EnterpriseSelectField,
} from '../FormHelperComponents'
import useGetEnterpriseFieldsOpts from '../../hooks/useGetEnterpriseFieldsOpts'
import { EnterpriseDataProps } from '../../interfaces'
import { textFields } from '../constants'
import { useStore } from '@ors/store'

import { map } from 'lodash'

const EnterpriseOverviewSection = ({
  mode,
  enterprise,
  ...rest
}: EnterpriseDataProps & {
  mode: string
}) => {
  const sectionIdentifier = 'overview'

  const userSlice = useStore((state) => state.user)
  const { agency_id } = userSlice.data

  const { enterpriseData, setEnterpriseData } = rest

  const { sectors, subsectors } = useGetEnterpriseFieldsOpts(
    enterpriseData,
    setEnterpriseData,
    mode,
  )

  const { countries, agencies, project_types } = useContext(ProjectsDataContext)
  const { statuses } = useContext(EnterprisesDataContext)

  const selectFields = [
    {
      fieldName: 'country',
      options: countries,
      isDisabled: mode === 'edit' && !!enterprise?.country,
    },
    { fieldName: 'agency', options: agencies, isDisabled: !!agency_id },
    { fieldName: 'project_type', options: project_types },
    { fieldName: 'sector', options: sectors },
    { fieldName: 'subsector', options: subsectors },
    { fieldName: 'status', options: statuses },
  ]

  return (
    <div className="flex flex-col gap-y-2">
      <EnterpriseTextField
        field={textFields[0]}
        isDisabled={mode === 'edit' && !!enterprise?.name}
        {...{ sectionIdentifier, ...rest }}
      />
      <div className="flex flex-wrap gap-x-20 gap-y-2">
        {map(selectFields.slice(0, 2), (field, index) => (
          <EnterpriseSelectField
            key={index}
            isDisabled={field.isDisabled}
            {...{ sectionIdentifier, field, ...rest }}
          />
        ))}
      </div>
      {map(textFields.slice(1, 3), (field, index) => (
        <EnterpriseTextField
          key={index}
          {...{ field, sectionIdentifier, ...rest }}
        />
      ))}
      <div className="flex flex-wrap gap-x-28 gap-y-2">
        {map(selectFields.slice(2, 5), (field, index) => (
          <EnterpriseSelectField
            key={index}
            {...{ sectionIdentifier, field, ...rest }}
          />
        ))}
      </div>
      <EnterpriseSelectField
        field={selectFields[5]}
        {...{ sectionIdentifier, ...rest }}
      />
    </div>
  )
}

export default EnterpriseOverviewSection
