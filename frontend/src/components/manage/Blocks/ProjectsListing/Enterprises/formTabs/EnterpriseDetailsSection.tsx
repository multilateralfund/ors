import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import {
  getMeetingNr,
  useMeetingOptions,
} from '@ors/components/manage/Utils/utilFunctions'
import { FieldErrorIndicator } from '../../HelperComponents'
import {
  EnterpriseDateField,
  EnterpriseNumberField,
  EnterpriseTextAreaField,
  EnterpriseTextField,
} from '../FormHelperComponents'
import { EnterpriseFormProps } from '../interfaces'
import {
  dateFields,
  decimalFields,
  detailsDateFields,
  enterpriseFieldsMapping,
  integerFields,
  textFields,
} from '../constants'
import { parseNumber } from '@ors/helpers'

import { map } from 'lodash'

const EnterpriseDetailsSection = (props: EnterpriseFormProps) => {
  const sectionIdentifier = 'details'

  const { enterpriseData, setEnterpriseData, errors } = props
  const { details } = enterpriseData

  const handleChangeMeeting = (meeting?: string) => {
    setEnterpriseData(
      (prevData) => ({
        ...prevData,
        [sectionIdentifier]: {
          ...prevData[sectionIdentifier],
          meeting: parseNumber(meeting),
        },
      }),
      'meeting',
    )
  }

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex flex-wrap gap-x-[5.5rem] gap-y-2">
        {map(decimalFields, (field, index) => (
          <EnterpriseNumberField
            key={index}
            dataType="decimal"
            {...{ sectionIdentifier, field, ...props }}
          />
        ))}
      </div>
      <EnterpriseTextField
        field={textFields[4]}
        {...{ sectionIdentifier, ...props }}
      />
      <div className="flex flex-wrap gap-x-[5.5rem] gap-y-2">
        <EnterpriseTextField
          field={textFields[3]}
          {...{ sectionIdentifier, ...props }}
        />
        <EnterpriseNumberField
          dataType="integer"
          field={integerFields[0]}
          {...{ sectionIdentifier, ...props }}
        />
        <EnterpriseDateField
          field={dateFields[0]}
          {...{ sectionIdentifier, ...props }}
        />
      </div>
      <div className="flex flex-wrap gap-x-[5.5rem] gap-y-2">
        {map(detailsDateFields.slice(0, 2), (field, index) => (
          <EnterpriseDateField
            key={index}
            {...{
              field,
              sectionIdentifier,
              ...props,
            }}
          />
        ))}
        <EnterpriseNumberField
          dataType="integer"
          field="project_duration"
          {...{
            sectionIdentifier,
            ...props,
          }}
        />
      </div>
      <div className="flex flex-wrap gap-x-[5.5rem] gap-y-2">
        <div className="w-40">
          <Label>{enterpriseFieldsMapping.meeting}</Label>
          <div className="flex items-center">
            <PopoverInput
              label={getMeetingNr(details?.meeting ?? undefined)?.toString()}
              options={useMeetingOptions()}
              onChange={handleChangeMeeting}
              onClear={handleChangeMeeting}
              withClear={true}
              clearBtnClassName="right-1"
              className="!m-0 h-10 !py-1"
            />
            <FieldErrorIndicator field="meeting" {...{ errors }} />
          </div>
        </div>
        {map(detailsDateFields.slice(2), (field, index) => (
          <EnterpriseDateField
            key={index}
            isDisabled={field === 'date_of_approval'}
            {...{
              field,
              sectionIdentifier,
              ...props,
            }}
          />
        ))}
      </div>
      <div className="max-w-[41rem]">
        <EnterpriseTextAreaField
          field="excom_provision"
          {...{
            sectionIdentifier,
            ...props,
          }}
        />
      </div>
    </div>
  )
}

export default EnterpriseDetailsSection
