import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { EnterpriseOverview, PEnterpriseDataProps } from '../interfaces'
import {
  getFieldDefaultProps,
  getIsInputInvalid,
  handleChangeNumericValues,
  handleChangeSelectValues,
  handleChangeTextValues,
} from '../ProjectsEnterprises/utils'
import {
  defaultProps,
  defaultPropsSimpleField,
  tableColumns,
  textAreaClassname,
} from '../constants'

import { TextareaAutosize } from '@mui/material'
import { filter, includes } from 'lodash'
import cx from 'classnames'

type PEnterpriseFieldsProps = PEnterpriseDataProps & {
  field: string
  isDisabled: boolean
}

const sectionIdentifier = 'overview'

export const EnterpriseTextField = ({
  enterpriseData,
  setEnterpriseData,
  field,
  isDisabled,
  hasSubmitted,
  errors,
}: PEnterpriseFieldsProps) => (
  <div>
    <Label>{tableColumns[field]}</Label>
    <SimpleInput
      id={field}
      disabled={isDisabled}
      value={
        enterpriseData[sectionIdentifier][field as keyof EnterpriseOverview]
      }
      onChange={(event) =>
        handleChangeTextValues(
          sectionIdentifier,
          field,
          setEnterpriseData,
          event,
        )
      }
      type="text"
      {...getFieldDefaultProps(hasSubmitted, errors[field], isDisabled)}
      containerClassName={
        defaultPropsSimpleField.containerClassName + ' !w-[35rem]'
      }
    />
  </div>
)

export const EnterpriseNumberField = ({
  enterpriseData,
  setEnterpriseData,
  field,
  isDisabled,
  hasSubmitted,
  errors,
}: PEnterpriseFieldsProps) => (
  <div>
    <Label>{tableColumns[field]} (%)</Label>
    <SimpleInput
      id={field}
      disabled={isDisabled}
      value={
        enterpriseData[sectionIdentifier][field as keyof EnterpriseOverview] ??
        ''
      }
      onChange={(event) =>
        handleChangeNumericValues(
          sectionIdentifier,
          field,
          setEnterpriseData,
          event,
        )
      }
      type="text"
      {...getFieldDefaultProps(hasSubmitted, errors[field], isDisabled)}
    />
  </div>
)

export const EnterpriseSelectField = ({
  enterpriseData,
  setEnterpriseData,
  field,
  isDisabled,
  hasSubmitted,
  errors,
}: PEnterpriseDataProps & {
  field: { fieldName: string; options: any }
  isDisabled: boolean
}) => {
  const { fieldName, options } = field
  const isMultiple = fieldName === 'agencies'
  const value = isMultiple
    ? filter(options, (option) =>
        includes(
          enterpriseData[sectionIdentifier][
            fieldName as keyof EnterpriseOverview
          ] as number[],
          option.id,
        ),
      )
    : enterpriseData[sectionIdentifier][fieldName as keyof EnterpriseOverview]

  return (
    <div>
      <Label>{tableColumns[fieldName]}</Label>
      <Field
        widget="autocomplete"
        multiple={isMultiple}
        disabled={isDisabled}
        options={options}
        value={value}
        onChange={(_, value) =>
          handleChangeSelectValues(
            sectionIdentifier,
            fieldName,
            setEnterpriseData,
            value,
            isMultiple,
          )
        }
        getOptionLabel={(option) => getOptionLabel(options, option)}
        Input={{
          error: getIsInputInvalid(hasSubmitted, errors[fieldName]),
        }}
        {...defaultProps}
        {...(isMultiple
          ? { FieldProps: { className: 'mb-0 w-[35rem] BPListUpload' } }
          : {})}
      />
    </div>
  )
}

export const EnterpriseTextAreaField = ({
  enterpriseData,
  setEnterpriseData,
  field,
  isDisabled,
  hasSubmitted,
  errors,
}: PEnterpriseFieldsProps) => (
  <div>
    <Label>{tableColumns[field]}</Label>
    <TextareaAutosize
      disabled={isDisabled}
      value={
        enterpriseData[sectionIdentifier][
          field as keyof EnterpriseOverview
        ] as string
      }
      onChange={(event) =>
        handleChangeTextValues(
          sectionIdentifier,
          field,
          setEnterpriseData,
          event,
        )
      }
      className={cx(textAreaClassname + ' !min-w-[45rem]', {
        'border-red-500': getIsInputInvalid(hasSubmitted, errors[field]),
      })}
      minRows={5}
      tabIndex={-1}
    />
  </div>
)
