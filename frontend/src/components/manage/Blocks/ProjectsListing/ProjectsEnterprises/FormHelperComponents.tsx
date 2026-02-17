import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { DateInput, FormattedNumberInput } from '../../Replenishment/Inputs'
import { STYLE } from '../../Replenishment/Inputs/constants'
import { FieldErrorIndicator } from '../HelperComponents'
import { EnterprisesCommonProps, SetEnterpriseData } from '../interfaces'
import { enterpriseFieldsMapping } from './constants'
import { onTextareaFocus } from '../utils'
import {
  getFieldDefaultProps,
  handleChangeIntegerValues,
  handleChangeDecimalValues,
  handleChangeSelectValues,
  handleChangeTextValues,
  handleChangeDateValues,
} from '../ProjectsEnterprises/utils'
import {
  defaultProps,
  defaultPropsSimpleField,
  textAreaClassname,
} from '../constants'

import { TextareaAutosize } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import cx from 'classnames'
import dayjs from 'dayjs'

type PEnterpriseFieldsProps<T, K> = EnterprisesCommonProps & {
  enterpriseData: K
  setEnterpriseData: SetEnterpriseData<T>
  field: string
  sectionIdentifier?: keyof T
  isDisabled: boolean
}

export const EnterpriseTextField = <T, K>({
  enterpriseData,
  setEnterpriseData,
  field,
  sectionIdentifier,
  isDisabled,
  errors,
}: PEnterpriseFieldsProps<T, K>) => (
  <div>
    <Label>{enterpriseFieldsMapping[field]}</Label>
    <div className="flex items-center">
      <SimpleInput
        id={field}
        disabled={isDisabled}
        value={enterpriseData[field as keyof K]}
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
        {...getFieldDefaultProps(isDisabled)}
        containerClassName={cx(
          defaultPropsSimpleField.containerClassName,
          field !== 'stage' && ' w-full max-w-[41rem]',
        )}
      />
      <FieldErrorIndicator {...{ field, errors }} />
    </div>
  </div>
)

export const EnterpriseNumberField = <T, K>({
  enterpriseData,
  setEnterpriseData,
  field,
  dataType,
  prefix,
  sectionIdentifier,
  isDisabled,
  errors,
}: PEnterpriseFieldsProps<T, K> & { dataType: string; prefix?: string }) => {
  const isInteger = dataType === 'integer'

  return (
    <div>
      <Label>{enterpriseFieldsMapping[field]}</Label>
      <div className="flex items-center">
        <FormattedNumberInput
          id={field}
          disabled={isDisabled}
          withoutDefaultValue={true}
          decimalDigits={isInteger ? 0 : 2}
          prefix={prefix}
          value={(enterpriseData[field as keyof K] as string) ?? ''}
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
          {...getFieldDefaultProps(isDisabled)}
        />
        <FieldErrorIndicator {...{ field, errors }} />
      </div>
    </div>
  )
}

export const EnterpriseSelectField = <T, K>({
  enterpriseData,
  setEnterpriseData,
  field,
  sectionIdentifier,
  isDisabled,
  errors,
}: EnterprisesCommonProps & {
  enterpriseData: K
  setEnterpriseData: SetEnterpriseData<T>
  field: { fieldName: string; options: any }
  sectionIdentifier?: keyof T
  isDisabled: boolean
}) => {
  const { fieldName, options } = field

  return (
    <div>
      <Label>{enterpriseFieldsMapping[fieldName]}</Label>
      <div className="flex items-center">
        <Field
          widget="autocomplete"
          disabled={isDisabled}
          options={options}
          value={enterpriseData[fieldName as keyof K]}
          onChange={(_, value) =>
            handleChangeSelectValues<T>(
              fieldName,
              setEnterpriseData,
              value,
              sectionIdentifier,
            )
          }
          getOptionLabel={(option) => getOptionLabel(options, option)}
          {...defaultProps}
          FieldProps={{
            ...defaultProps.FieldProps,
            className: defaultProps.FieldProps.className + ' w-[18rem]',
          }}
        />
        <FieldErrorIndicator field={fieldName} {...{ errors }} />
      </div>
    </div>
  )
}

export const EnterpriseTextAreaField = <T, K>({
  enterpriseData,
  setEnterpriseData,
  field,
  sectionIdentifier,
  isDisabled,
  errors,
}: PEnterpriseFieldsProps<T, K>) => (
  <div>
    <Label>{enterpriseFieldsMapping[field]} (max 500 characters)</Label>
    <div className="flex items-center">
      <TextareaAutosize
        disabled={isDisabled}
        value={enterpriseData[field as keyof K] as string}
        onFocus={onTextareaFocus}
        onChange={(event) =>
          handleChangeTextValues<T>(
            field,
            setEnterpriseData,
            event,
            sectionIdentifier,
          )
        }
        className={cx(textAreaClassname, 'max-w-[45rem]')}
        maxLength={500}
        style={STYLE}
        minRows={5}
      />
      <FieldErrorIndicator {...{ field, errors }} />
    </div>
  </div>
)

export const EnterpriseDateField = <T, K>({
  enterpriseData,
  setEnterpriseData,
  field,
  sectionIdentifier,
  isDisabled,
  errors,
}: PEnterpriseFieldsProps<T, K>) => (
  <div>
    <Label>{enterpriseFieldsMapping[field]}</Label>
    <div className="flex items-center">
      <DateInput
        id={field}
        value={enterpriseData[field as keyof K] as string}
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
        {...getFieldDefaultProps(isDisabled)}
      />
      <FieldErrorIndicator {...{ field, errors }} />
    </div>
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
