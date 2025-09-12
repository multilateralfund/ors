import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { EnterpriseDataProps, EnterpriseOverview } from '../interfaces'
import {
  defaultProps,
  defaultPropsSimpleField,
  tableColumns,
  textAreaClassname,
} from '../constants'
import {
  getFieldDefaultProps,
  handleChangeTextValues,
  getIsInputInvalid,
  handleChangeSelectValues,
  handleChangeNumericValues,
} from './utils'

import { TextareaAutosize } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { filter, includes } from 'lodash'
import cx from 'classnames'

type EnterpriseFieldsProps = EnterpriseDataProps & {
  field: string
  isDisabled: boolean
}

export const EnterpriseTextField = ({
  enterpriseData,
  setEnterpriseData,
  field,
  isDisabled,
  hasSubmitted,
  errors,
}: EnterpriseFieldsProps) => (
  <div>
    <Label>{tableColumns[field]}</Label>
    <SimpleInput
      id={field}
      disabled={isDisabled}
      value={enterpriseData[field as keyof EnterpriseOverview]}
      onChange={(event) =>
        handleChangeTextValues(field, setEnterpriseData, event)
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
}: EnterpriseFieldsProps) => (
  <div>
    <Label>{tableColumns[field]} (%)</Label>
    <SimpleInput
      id={field}
      disabled={isDisabled}
      value={enterpriseData[field as keyof EnterpriseOverview] ?? ''}
      onChange={(event) =>
        handleChangeNumericValues(field, setEnterpriseData, event)
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
}: EnterpriseDataProps & {
  field: { fieldName: string; options: any }
  isDisabled: boolean
}) => {
  const { fieldName, options } = field
  const isMultiple = fieldName === 'agencies'
  const value = isMultiple
    ? filter(options, (option) =>
        includes(
          enterpriseData[fieldName as keyof EnterpriseOverview] as number[],
          option.id,
        ),
      )
    : enterpriseData[fieldName as keyof EnterpriseOverview]

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
}: EnterpriseFieldsProps) => (
  <div>
    <Label>{tableColumns[field]}</Label>
    <TextareaAutosize
      disabled={isDisabled}
      value={enterpriseData[field as keyof EnterpriseOverview] as string}
      onChange={(event) =>
        handleChangeTextValues(field, setEnterpriseData, event)
      }
      className={cx(textAreaClassname + ' !min-w-[45rem]', {
        'border-red-500': getIsInputInvalid(hasSubmitted, errors[field]),
      })}
      minRows={5}
      tabIndex={-1}
    />
  </div>
)

export const handleErrors = async (
  error: any,
  setEnterpriseId: (id: number | null) => void,
  setErrors: (errors: { [key: string]: string[] }) => void,
  setOtherErrors: (errors: string) => void,
) => {
  const errors = await error.json()

  if (error.status === 400) {
    setErrors(errors)

    if (errors?.details) {
      setOtherErrors(errors.details)
    }
  }

  setEnterpriseId(null)
  enqueueSnackbar(<>An error occurred. Please try again.</>, {
    variant: 'error',
  })
}

export const EnterpriseStatus = ({ status }: { status: string }) => (
  <div className="mt-4 flex items-center gap-3">
    <span>Status:</span>
    <span className="rounded border border-solid border-[#002A3C] px-1 py-0.5 font-medium uppercase leading-tight text-[#002A3C]">
      {status}
    </span>
  </div>
)
