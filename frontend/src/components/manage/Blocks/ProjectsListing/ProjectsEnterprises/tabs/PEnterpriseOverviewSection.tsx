import { useContext } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { FieldErrorIndicator } from '../../HelperComponents'
import {
  EnterpriseDateField,
  EnterpriseNumberField,
  EnterpriseSelectField,
  EnterpriseTextField,
} from '../FormHelperComponents'
import useGetEnterpriseFieldsOpts from '../../hooks/useGetEnterpriseFieldsOpts'
import { dateFields, decimalFields, textFields } from '../constants'
import { defaultProps } from '../../constants'
import {
  EnterpriseOverview,
  OptionsType,
  PEnterpriseData,
  PEnterpriseDataProps,
} from '../../interfaces'

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
  const { countries } = useContext(ProjectsDataContext)

  const { enterprise, enterpriseData, setEnterpriseData } = rest
  const { overview } = enterpriseData

  const isDisabled =
    !canEditProjectEnterprise ||
    enterprise?.status === 'Approved' ||
    overview.status === 'Approved'

  const sectionIdentifier = 'overview'
  const { sectors, subsectors } = useGetEnterpriseFieldsOpts<PEnterpriseData>(
    overview,
    setEnterpriseData,
    sectionIdentifier,
  )

  const selectFields = [
    {
      fieldName: 'country',
      options: countries,
      isDisabled: isDisabled || !!countryId,
    },
    { fieldName: 'sector', options: sectors, isDisabled: isDisabled },
    { fieldName: 'subsector', options: subsectors, isDisabled: isDisabled },
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
    <div className="flex flex-col gap-y-2">
      {!!enterprise && canApproveProjectEnterprise && (
        <div>
          <Label>Status</Label>
          <div className="flex items-center">
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
            <FieldErrorIndicator field="status" errors={rest.errors} />
          </div>
        </div>
      )}
      <EnterpriseTextField<PEnterpriseData, EnterpriseOverview>
        field={textFields[0]}
        {...{ sectionIdentifier, isDisabled, ...rest }}
        enterpriseData={overview}
      />
      <EnterpriseSelectField<PEnterpriseData, EnterpriseOverview>
        field={selectFields[0]}
        isDisabled={selectFields[0].isDisabled}
        {...{ sectionIdentifier, ...rest }}
        enterpriseData={overview}
      />
      {map(textFields.slice(1, 3), (field) => (
        <EnterpriseTextField<PEnterpriseData, EnterpriseOverview>
          {...{ field, sectionIdentifier, isDisabled, ...rest }}
          enterpriseData={overview}
        />
      ))}
      <div className="flex flex-wrap gap-x-20 gap-y-2">
        {map(selectFields.slice(1), (field) => (
          <EnterpriseSelectField<PEnterpriseData, EnterpriseOverview>
            isDisabled={field.isDisabled}
            {...{ sectionIdentifier, field, ...rest }}
            enterpriseData={overview}
          />
        ))}
      </div>
      <EnterpriseTextField<PEnterpriseData, EnterpriseOverview>
        field={textFields[3]}
        {...{ sectionIdentifier, isDisabled, ...rest }}
        enterpriseData={overview}
      />
      <div className="flex flex-wrap gap-x-20 gap-y-2">
        {map(decimalFields, (field) => (
          <EnterpriseNumberField<PEnterpriseData, EnterpriseOverview>
            dataType="decimal"
            {...{ sectionIdentifier, field, isDisabled, ...rest }}
            enterpriseData={overview}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-20 gap-y-2">
        {/* <EnterpriseNumberField<PEnterpriseData,EnterpriseOverview>
                dataType="integer"
                field={integerFields[0]}
            {...{ sectionIdentifier, isDisabled, ...rest }}
            enterpriseData={overview}
          /> */}
        <EnterpriseDateField<PEnterpriseData, EnterpriseOverview>
          field={dateFields[0]}
          {...{ sectionIdentifier, isDisabled, ...rest }}
          enterpriseData={overview}
        />
      </div>
    </div>
  )
}

export default PEnterpriseOverviewSection
