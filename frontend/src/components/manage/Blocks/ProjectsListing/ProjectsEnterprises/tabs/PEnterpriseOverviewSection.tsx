import {
  EnterpriseNumberField,
  EnterpriseSelectField,
  EnterpriseTextAreaField,
  EnterpriseTextField,
} from '../FormHelperComponents'
import { EnterpriseType, PEnterpriseDataProps } from '../../interfaces'
import { useStore } from '@ors/store'

import { map } from 'lodash'

const PEnterpriseOverviewSection = ({
  countryId,
  ...rest
}: PEnterpriseDataProps & {
  countryId: number | null
}) => {
  const commonSlice = useStore((state) => state.common)
  const countries = commonSlice.countries.data
  const agencies = commonSlice.agencies.data

  const { enterprise, enterpriseData } = rest
  const overviewStatus = (enterpriseData.overview as EnterpriseType).status
  const isDisabled =
    (!!enterprise && enterprise.status !== 'Pending Approval') ||
    (!!overviewStatus && overviewStatus !== 'Pending Approval')

  const textFields = ['name', 'location', 'application']
  const numericFields = ['local_ownership', 'export_to_non_a5']
  const selectFields = [
    { fieldName: 'agencies', options: agencies, isDisabled: isDisabled },
    {
      fieldName: 'country',
      options: countries,
      isDisabled: isDisabled || !!countryId,
    },
  ]

  return (
    <>
      <EnterpriseTextField field={textFields[0]} {...{ isDisabled, ...rest }} />
      {map(selectFields, (field) => (
        <EnterpriseSelectField
          isDisabled={field.isDisabled}
          {...{ field, ...rest }}
        />
      ))}
      {map(textFields.slice(1), (field) => (
        <EnterpriseTextField {...{ field, isDisabled, ...rest }} />
      ))}
      <div className="mt-6 flex flex-wrap gap-x-20 gap-y-3">
        {map(numericFields, (field) => (
          <EnterpriseNumberField {...{ field, isDisabled, ...rest }} />
        ))}
      </div>
      <div className="mt-6">
        <EnterpriseTextAreaField field="remarks" {...{ isDisabled, ...rest }} />
      </div>
    </>
  )
}

export default PEnterpriseOverviewSection
