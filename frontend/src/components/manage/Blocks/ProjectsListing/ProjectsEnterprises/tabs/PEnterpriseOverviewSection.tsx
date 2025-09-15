import {
  EnterpriseNumberField,
  EnterpriseSelectField,
  EnterpriseTextAreaField,
  EnterpriseTextField,
} from '../FormHelperComponents'
import {
  EnterpriseType,
  PEnterpriseData,
  PEnterpriseDataProps,
} from '../../interfaces'
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
  const { overview } = enterpriseData
  const overviewStatus = (overview as EnterpriseType).status
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
      <EnterpriseTextField<PEnterpriseData>
        field={textFields[0]}
        {...{ isDisabled, ...rest }}
        enterpriseData={overview}
      />
      {map(selectFields, (field) => (
        <EnterpriseSelectField<PEnterpriseData>
          isDisabled={field.isDisabled}
          {...{ field, ...rest }}
          enterpriseData={overview}
        />
      ))}
      {map(textFields.slice(1), (field) => (
        <EnterpriseTextField<PEnterpriseData>
          {...{ field, isDisabled, ...rest }}
          enterpriseData={overview}
        />
      ))}
      <div className="mt-6 flex flex-wrap gap-x-20 gap-y-3">
        {map(numericFields, (field) => (
          <EnterpriseNumberField<PEnterpriseData>
            {...{ field, isDisabled, ...rest }}
            enterpriseData={overview}
          />
        ))}
      </div>
      <div className="mt-6">
        <EnterpriseTextAreaField<PEnterpriseData>
          field="remarks"
          {...{ isDisabled, ...rest }}
          enterpriseData={overview}
        />
      </div>
    </>
  )
}

export default PEnterpriseOverviewSection
