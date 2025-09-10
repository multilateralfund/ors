import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import Field from '@ors/components/manage/Form/Field'
import { EnterpriseDataProps, EnterpriseOverview } from '../../interfaces'
import {
  defaultProps,
  defaultPropsSimpleField,
  tableColumns,
  textAreaClassname,
} from '../../constants'
import {
  getFieldDefaultProps,
  handleChangeNumericValues,
  handleChangeTextValues,
  getIsInputInvalid,
} from '../utils'
import { useStore } from '@ors/store'

import { TextareaAutosize } from '@mui/material'
import { map } from 'lodash'
import cx from 'classnames'

const PEnterprisesOverviewSection = ({
  enterpriseData,
  setEnterpriseData,
  countryId,
  hasSubmitted,
  errors = {},
}: EnterpriseDataProps & {
  countryId: number | null
}) => {
  const sectionId = 'overview'
  const sectionData: EnterpriseOverview & { id?: number | null } =
    enterpriseData[sectionId]

  const commonSlice = useStore((state) => state.common)
  const countries = commonSlice.countries.data

  const textFields = ['name', 'location', 'application']
  const numericFields = ['local_ownership', 'export_to_non_a5']

  const isFieldDisabled = !!sectionData.id

  const displayTextField = (field: string) => (
    <div>
      <Label>{tableColumns[field]}</Label>
      <SimpleInput
        id={field}
        value={sectionData[field as keyof EnterpriseOverview]}
        disabled={isFieldDisabled}
        onChange={(event) =>
          handleChangeTextValues(sectionId, field, setEnterpriseData, event)
        }
        type="text"
        {...getFieldDefaultProps(hasSubmitted, errors[field], isFieldDisabled)}
        containerClassName={
          defaultPropsSimpleField.containerClassName + ' !w-[35rem]'
        }
      />
    </div>
  )

  const handleCountryChange = (value: any) => {
    setEnterpriseData((prevData) => ({
      ...prevData,
      [sectionId]: {
        ...prevData[sectionId],
        country: value?.id ?? null,
      },
    }))
  }

  return (
    <>
      {displayTextField(textFields[0])}
      <div>
        <Label>{tableColumns.country}</Label>
        <Field
          widget="autocomplete"
          options={countries}
          value={sectionData['country']}
          disabled={!!countryId || isFieldDisabled}
          onChange={(_, value) => {
            handleCountryChange(value)
          }}
          getOptionLabel={(option: any) => getOptionLabel(countries, option)}
          {...defaultProps}
        />
      </div>
      {map(textFields.slice(1), (field) => displayTextField(field))}
      <div className="mt-6 flex flex-wrap gap-x-20 gap-y-3">
        {map(numericFields, (field) => (
          <div>
            <Label>{tableColumns[field]} (%)</Label>
            <SimpleInput
              id={field}
              value={sectionData[field as keyof EnterpriseOverview] ?? ''}
              disabled={isFieldDisabled}
              onChange={(event) =>
                handleChangeNumericValues(
                  sectionId,
                  field,
                  setEnterpriseData,
                  event,
                )
              }
              type="text"
              {...getFieldDefaultProps(
                hasSubmitted,
                errors[field],
                isFieldDisabled,
              )}
            />
          </div>
        ))}
      </div>
      <Label>{tableColumns.remarks}</Label>
      <TextareaAutosize
        value={sectionData['remarks']}
        disabled={isFieldDisabled}
        onChange={(event) =>
          handleChangeTextValues(sectionId, 'remarks', setEnterpriseData, event)
        }
        className={cx(textAreaClassname + ' !min-w-[45rem]', {
          'border-red-500': getIsInputInvalid(hasSubmitted, errors['remarks']),
        })}
        minRows={5}
        tabIndex={-1}
      />
    </>
  )
}

export default PEnterprisesOverviewSection
