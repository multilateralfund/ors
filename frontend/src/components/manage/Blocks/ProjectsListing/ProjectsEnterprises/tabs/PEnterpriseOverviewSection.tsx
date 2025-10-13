import { useContext } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import {
  EnterpriseNumberField,
  EnterpriseSelectField,
  EnterpriseTextAreaField,
  EnterpriseTextField,
} from '../FormHelperComponents'
import { defaultProps } from '../../constants'
import {
  EnterpriseType,
  OptionsType,
  PEnterpriseData,
  PEnterpriseDataProps,
} from '../../interfaces'
import { useStore } from '@ors/store'

import { map } from 'lodash'

const PEnterpriseOverviewSection = ({
  countryId,
  enterpriseStatuses,
  ...rest
}: PEnterpriseDataProps & {
  countryId: number | null
  enterpriseStatuses?: OptionsType[]
}) => {
  const { canEditProjectEnterprise, canApproveProjectEnterprise } =
    useContext(PermissionsContext)

  const commonSlice = useStore((state) => state.common)
  const countries = commonSlice.countries.data
  const agencies = commonSlice.agencies.data

  const { enterprise, enterpriseData, setEnterpriseData } = rest
  const { overview } = enterpriseData
  const overviewStatus = (overview as EnterpriseType).status
  const isDisabled =
    !canEditProjectEnterprise ||
    enterprise?.status === 'Approved' ||
    overviewStatus === 'Approved'

  const sectionIdentifier = 'overview'
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

  const handleChangeLinkStatus = (value: any) => {
    setEnterpriseData((prev) => ({
      ...prev,
      [sectionIdentifier]: {
        ...prev[sectionIdentifier],
        linkStatus: value.id,
      },
    }))
  }

  return (
    <>
      {!!enterprise && canApproveProjectEnterprise && (
        <div>
          <Label>Status</Label>
          <Field
            widget="autocomplete"
            options={enterpriseStatuses}
            value={overview.linkStatus}
            disabled={
              !canEditProjectEnterprise || enterprise.status === 'Approved'
            }
            onChange={(_, value) => handleChangeLinkStatus(value)}
            disableClearable
            {...defaultProps}
          />
        </div>
      )}
      <EnterpriseTextField<PEnterpriseData>
        field={textFields[0]}
        sectionIdentifier={sectionIdentifier}
        {...{ isDisabled, ...rest }}
        enterpriseData={overview}
      />
      {map(selectFields, (field) => (
        <EnterpriseSelectField<PEnterpriseData>
          sectionIdentifier={sectionIdentifier}
          isDisabled={field.isDisabled}
          {...{ field, ...rest }}
          enterpriseData={overview}
        />
      ))}
      {map(textFields.slice(1), (field) => (
        <EnterpriseTextField<PEnterpriseData>
          sectionIdentifier={sectionIdentifier}
          {...{ field, isDisabled, ...rest }}
          enterpriseData={overview}
        />
      ))}
      <div className="mt-6 flex flex-wrap gap-x-20 gap-y-3">
        {map(numericFields, (field) => (
          <EnterpriseNumberField<PEnterpriseData>
            sectionIdentifier={sectionIdentifier}
            {...{ field, isDisabled, ...rest }}
            enterpriseData={overview}
          />
        ))}
      </div>
      <div className="mt-6">
        <EnterpriseTextAreaField<PEnterpriseData>
          field="remarks"
          sectionIdentifier={sectionIdentifier}
          {...{ isDisabled, ...rest }}
          enterpriseData={overview}
        />
      </div>
    </>
  )
}

export default PEnterpriseOverviewSection
