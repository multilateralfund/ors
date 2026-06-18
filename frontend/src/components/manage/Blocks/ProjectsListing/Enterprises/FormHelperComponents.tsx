import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { STYLE } from '@ors/components/manage/Blocks/Replenishment/Inputs/constants'
import {
  FormattedNumberInput,
  DateInput,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { FieldErrorIndicator } from '../HelperComponents'
import { getNonFieldErrors, onTextareaFocus } from '../utils'
import { enterpriseFieldsMapping } from './constants'
import { EnterpriseFieldsProps } from './interfaces'
import { OptionsType } from '../interfaces'
import {
  defaultProps,
  defaultPropsSimpleField,
  textAreaClassname,
} from '../constants'
import {
  getFieldDefaultProps,
  handleChangeTextValues,
  handleChangeSelectValues,
  handleChangeIntegerValues,
  handleChangeDecimalValues,
  handleChangeDateValues,
} from './utils'
import { InlineMessage } from '@ors/types/store'

import { TextareaAutosize } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { omit } from 'lodash'
import cx from 'classnames'
import dayjs from 'dayjs'

export const EnterpriseStatus = ({ status }: { status: string }) => (
  <div className="mt-4 flex items-center gap-1.5">
    <span>Status:</span>
    {!!status ? (
      <span className="rounded border border-solid border-[#002A3C] px-1 py-0.5 font-medium uppercase leading-tight text-[#002A3C]">
        {status}
      </span>
    ) : (
      '-'
    )}
  </div>
)

export const EnterpriseTextField = ({
  enterpriseData,
  setEnterpriseData,
  sectionIdentifier,
  field,
  errors,
  isDisabled,
}: EnterpriseFieldsProps) => (
  <div>
    <Label>{enterpriseFieldsMapping[field]}</Label>
    <div className="flex items-center">
      <SimpleInput
        id={field}
        type="text"
        disabled={isDisabled}
        value={
          (enterpriseData[sectionIdentifier] as Record<string, any>)[field]
        }
        onChange={(event) =>
          handleChangeTextValues(
            event,
            sectionIdentifier,
            field,
            setEnterpriseData,
          )
        }
        onFocus={onTextareaFocus}
        {...getFieldDefaultProps(isDisabled)}
        containerClassName={cx(defaultPropsSimpleField.containerClassName, {
          'w-full max-w-[41rem]': field !== 'stage',
        })}
      />
      <FieldErrorIndicator {...{ field, errors }} />
    </div>
  </div>
)

export const EnterpriseNumberField = ({
  enterpriseData,
  setEnterpriseData,
  sectionIdentifier,
  field,
  errors,
  isDisabled,
  dataType,
  prefix,
}: EnterpriseFieldsProps & { dataType: string; prefix?: string }) => {
  const isInteger = dataType === 'integer'
  const computedFields = ['funds_approved', 'cost_effectiveness_approved']

  return (
    <div>
      <Label>
        {enterpriseFieldsMapping[field]}
        {computedFields.includes(field) && ' (computed)'}
      </Label>
      <div className="flex items-center">
        <FormattedNumberInput
          id={field}
          disabled={isDisabled}
          prefix={prefix}
          withoutDefaultValue={true}
          decimalDigits={isInteger ? 0 : 2}
          value={
            ((enterpriseData[sectionIdentifier] as Record<string, any>)[
              field
            ] as string) ?? ''
          }
          onChange={(event) =>
            isInteger
              ? handleChangeIntegerValues(
                  event,
                  sectionIdentifier,
                  field,
                  setEnterpriseData,
                )
              : handleChangeDecimalValues(
                  event,
                  sectionIdentifier,
                  field,
                  setEnterpriseData,
                )
          }
          {...omit(getFieldDefaultProps(isDisabled), 'containerClassName')}
        />
        <FieldErrorIndicator {...{ field, errors }} />
      </div>
    </div>
  )
}

export const EnterpriseSelectField = ({
  enterpriseData,
  setEnterpriseData,
  sectionIdentifier,
  field,
  errors,
  isDisabled,
}: Omit<EnterpriseFieldsProps, 'field'> & {
  field: { fieldName: string; options: OptionsType[] }
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
          getOptionLabel={(option) => getOptionLabel(options, option)}
          value={
            (enterpriseData[sectionIdentifier] as Record<string, any>)[
              fieldName
            ]
          }
          onChange={(_, value) =>
            handleChangeSelectValues(
              value,
              sectionIdentifier,
              fieldName,
              setEnterpriseData,
            )
          }
          {...defaultProps}
          {...(fieldName === 'subsector' && {
            FieldProps: {
              ...defaultProps.FieldProps,
              className: cx('sm:w-[21rem]', defaultProps.FieldProps.className),
            },
          })}
        />
        <div className="w-8">
          <FieldErrorIndicator field={fieldName} {...{ errors }} />
        </div>
      </div>
    </div>
  )
}

export const EnterpriseTextAreaField = ({
  enterpriseData,
  setEnterpriseData,
  sectionIdentifier,
  field,
  errors,
  isDisabled,
}: EnterpriseFieldsProps) => (
  <div>
    <Label>{enterpriseFieldsMapping[field]} (max 500 characters)</Label>
    <div className="flex items-center">
      <TextareaAutosize
        disabled={isDisabled}
        value={
          (enterpriseData[sectionIdentifier] as Record<string, any>)[
            field
          ] as string
        }
        onChange={(event) =>
          handleChangeTextValues(
            event,
            sectionIdentifier,
            field,
            setEnterpriseData,
          )
        }
        onFocus={onTextareaFocus}
        className={cx(textAreaClassname, 'max-w-[45rem]')}
        maxLength={500}
        style={STYLE}
        minRows={5}
      />
      <FieldErrorIndicator {...{ field, errors }} />
    </div>
  </div>
)

export const EnterpriseDateField = ({
  enterpriseData,
  setEnterpriseData,
  sectionIdentifier,
  field,
  errors,
  isDisabled,
}: EnterpriseFieldsProps) => (
  <div>
    <Label>{enterpriseFieldsMapping[field]}</Label>
    <div className="flex items-center">
      <DateInput
        id={field}
        disabled={isDisabled}
        value={
          (enterpriseData[sectionIdentifier] as Record<string, any>)[
            field
          ] as string
        }
        formatValue={(value) => dayjs(value).format('DD/MM/YYYY')}
        onChange={(event) =>
          handleChangeDateValues(
            event,
            sectionIdentifier,
            field,
            setEnterpriseData,
          )
        }
        {...omit(getFieldDefaultProps(isDisabled), 'containerClassName')}
      />
      <FieldErrorIndicator {...{ field, errors }} />
    </div>
  </div>
)

export const handleErrors = async (
  error: any,
  setErrors: (errors: { [key: string]: string[] }) => void,
  setInlineMessage: (message: InlineMessage) => void,
) => {
  let errors: any = {}

  if (error instanceof Response) {
    const contentType = error.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      errors = await error.json()
    } else {
      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })

      return
    }

    if (error.status === 400) {
      setErrors(errors)

      const nonFieldErrors = getNonFieldErrors(errors)
      if (nonFieldErrors.length > 0) {
        setInlineMessage({
          type: 'error',
          errorMessages: nonFieldErrors,
        })
      }

      if (errors?.details) {
        setInlineMessage({
          type: 'error',
          message: errors.details,
        })
      }
    }
  }

  enqueueSnackbar(<>An error occurred. Please try again.</>, {
    variant: 'error',
  })
}
