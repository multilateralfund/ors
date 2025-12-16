import { Dispatch, SetStateAction } from 'react'

import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { DateInput, FormattedNumberInput } from '../../Replenishment/Inputs'
import { STYLE } from '../../Replenishment/Inputs/constants'
import { EnterpriseOverview, EnterprisesCommonProps } from '../interfaces'
import { enterpriseFieldsMapping } from './constants'
import {
  getFieldDefaultProps,
  getIsInputInvalid,
  handleChangeIntegerValues,
  handleChangeDecimalValues,
  handleChangeSelectValues,
  handleChangeTextValues,
  handleChangeDateValues,
} from '../ProjectsEnterprises/utils'
import { onTextareaFocus } from '../utils'
import {
  defaultProps,
  defaultPropsSimpleField,
  textAreaClassname,
} from '../constants'

import { TextareaAutosize } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import cx from 'classnames'
import dayjs from 'dayjs'

type PEnterpriseFieldsProps<T> = EnterprisesCommonProps & {
  enterpriseData: EnterpriseOverview
  setEnterpriseData: Dispatch<SetStateAction<T>>
  field: string
  sectionIdentifier?: keyof T
  isDisabled: boolean
}

export const EnterpriseTextField = <T,>({
  enterpriseData,
  setEnterpriseData,
  field,
  sectionIdentifier,
  isDisabled,
  hasSubmitted,
  errors,
}: PEnterpriseFieldsProps<T>) => (
  <div>
    <Label>{enterpriseFieldsMapping[field]}</Label>
    <SimpleInput
      id={field}
      disabled={isDisabled}
      value={enterpriseData[field as keyof EnterpriseOverview]}
      onFocus={onTextareaFocus}
      onChange={(event) =>
        handleChangeTextValues<T>(
          field,
          setEnterpriseData,
          event,
          sectionIdentifier,
        )
      }
      type="text"
      {...getFieldDefaultProps(hasSubmitted, errors[field], isDisabled)}
      containerClassName={cx(
        defaultPropsSimpleField.containerClassName,
        field !== 'stage' && ' w-full max-w-[41rem]',
      )}
    />
  </div>
)

export const EnterpriseNumberField = <T,>({
  enterpriseData,
  setEnterpriseData,
  field,
  dataType,
  sectionIdentifier,
  isDisabled,
  hasSubmitted,
  errors,
}: PEnterpriseFieldsProps<T> & { dataType: string }) => {
  const isInteger = dataType === 'integer'

  return (
    <div>
      <Label>
        {enterpriseFieldsMapping[field]} {!isInteger ? '(%)' : ''}
      </Label>
      <FormattedNumberInput
        id={field}
        disabled={isDisabled}
        withoutDefaultValue={true}
        decimalDigits={isInteger ? 0 : 2}
        value={
          (enterpriseData[field as keyof EnterpriseOverview] as string) ?? ''
        }
        onChange={(event) =>
          isInteger
            ? handleChangeIntegerValues<T>(
                field,
                setEnterpriseData,
                event,
                sectionIdentifier,
              )
            : handleChangeDecimalValues<T>(
                field,
                setEnterpriseData,
                event,
                sectionIdentifier,
              )
        }
        {...getFieldDefaultProps(hasSubmitted, errors[field], isDisabled)}
      />
    </div>
  )
}

export const EnterpriseSelectField = <T,>({
  enterpriseData,
  setEnterpriseData,
  field,
  sectionIdentifier,
  isDisabled,
  hasSubmitted,
  errors,
}: EnterprisesCommonProps & {
  enterpriseData: EnterpriseOverview
  setEnterpriseData: Dispatch<SetStateAction<T>>
  field: { fieldName: string; options: any }
  sectionIdentifier?: keyof T
  isDisabled: boolean
}) => {
  const { fieldName, options } = field
  const value = enterpriseData[fieldName as keyof EnterpriseOverview]

  return (
    <div>
      <Label>{enterpriseFieldsMapping[fieldName]}</Label>
      <Field
        widget="autocomplete"
        disabled={isDisabled}
        options={options}
        value={value}
        onChange={(_, value) =>
          handleChangeSelectValues<T>(
            fieldName,
            setEnterpriseData,
            value,
            sectionIdentifier,
          )
        }
        getOptionLabel={(option) => getOptionLabel(options, option)}
        Input={{
          error: getIsInputInvalid(hasSubmitted, errors[fieldName]),
        }}
        {...defaultProps}
        FieldProps={{
          ...defaultProps.FieldProps,
          className: defaultProps.FieldProps.className + ' w-[18rem]',
        }}
      />
    </div>
  )
}

export const EnterpriseTextAreaField = <T,>({
  enterpriseData,
  setEnterpriseData,
  field,
  sectionIdentifier,
  isDisabled,
  hasSubmitted,
  errors,
}: PEnterpriseFieldsProps<T>) => (
  <div>
    <Label>{enterpriseFieldsMapping[field]} (max 500 characters)</Label>
    <TextareaAutosize
      disabled={isDisabled}
      value={enterpriseData[field as keyof EnterpriseOverview] as string}
      onFocus={onTextareaFocus}
      onChange={(event) =>
        handleChangeTextValues<T>(
          field,
          setEnterpriseData,
          event,
          sectionIdentifier,
        )
      }
      className={cx(textAreaClassname + ' max-w-[45rem]', {
        'border-red-500': getIsInputInvalid(hasSubmitted, errors[field]),
      })}
      maxLength={500}
      style={STYLE}
      minRows={5}
    />
  </div>
)

export const EnterpriseDateField = <T,>({
  enterpriseData,
  setEnterpriseData,
  field,
  sectionIdentifier,
  isDisabled,
  hasSubmitted,
  errors,
}: PEnterpriseFieldsProps<T>) => (
  <div>
    <Label>{enterpriseFieldsMapping[field]}</Label>
    <DateInput
      id={field}
      value={enterpriseData[field as keyof EnterpriseOverview] as string}
      disabled={isDisabled}
      formatValue={(value) => dayjs(value).format('DD/MM/YYYY')}
      onChange={(event) =>
        handleChangeDateValues<T>(
          field,
          setEnterpriseData,
          event,
          sectionIdentifier,
        )
      }
      {...getFieldDefaultProps(hasSubmitted, errors[field], isDisabled)}
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
