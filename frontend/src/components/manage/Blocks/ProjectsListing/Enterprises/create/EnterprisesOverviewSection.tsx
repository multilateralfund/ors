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

const EnterprisesOverviewSection = ({
  enterpriseData,
  setEnterpriseData,
  hasSubmitted,
  errors = {},
}: EnterpriseDataProps) => {
  const commonSlice = useStore((state) => state.common)
  const countries = commonSlice.countries.data

  const textFields = ['name', 'location', 'application']
  const numericFields = ['local_ownership', 'export_to_non_a5']

  const displayTextField = (field: string) => (
    <div>
      <Label>{tableColumns[field]}</Label>
      <SimpleInput
        id={field}
        value={enterpriseData[field as keyof EnterpriseOverview]}
        onChange={(event) =>
          handleChangeTextValues(field, setEnterpriseData, event)
        }
        type="text"
        {...getFieldDefaultProps(hasSubmitted, errors[field])}
        containerClassName={
          defaultPropsSimpleField.containerClassName + ' !w-[35rem]'
        }
      />
    </div>
  )

  const handleCountryChange = (value: any) => {
    setEnterpriseData((prevData) => ({
      ...prevData,
      country: value?.id ?? null,
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
          value={enterpriseData['country']}
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
              value={enterpriseData[field as keyof EnterpriseOverview] ?? ''}
              onChange={(event) =>
                handleChangeNumericValues(field, setEnterpriseData, event)
              }
              type="text"
              {...getFieldDefaultProps(hasSubmitted, errors[field])}
            />
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Label>{tableColumns.remarks}</Label>
        <TextareaAutosize
          value={enterpriseData['remarks']}
          onChange={(event) =>
            handleChangeTextValues('remarks', setEnterpriseData, event)
          }
          className={cx(textAreaClassname + ' !min-w-[45rem]', {
            'border-red-500': getIsInputInvalid(
              hasSubmitted,
              errors['remarks'],
            ),
          })}
          minRows={5}
          tabIndex={-1}
        />
      </div>
    </>
  )
}

export default EnterprisesOverviewSection
