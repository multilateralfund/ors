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
import { EnterpriseData, SetEnterpriseData } from './interfaces'
import { getNonFieldErrors, onTextareaFocus } from '../utils'
import { enterpriseFieldsMapping } from './constants'
import {
  getFieldDefaultProps,
  handleChangeIntegerValues,
  handleChangeDecimalValues,
  handleChangeSelectValues,
  handleChangeTextValues,
  handleChangeDateValues,
} from './utils'
import {
  defaultProps,
  defaultPropsSimpleField,
  textAreaClassname,
} from '../constants'
import { InlineMessage } from '@ors/types/store'

import { TextareaAutosize } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { omit } from 'lodash'
import cx from 'classnames'
import dayjs from 'dayjs'

type EnterpriseFieldsProps = {
  enterpriseData: EnterpriseData
  setEnterpriseData: SetEnterpriseData
  field: string
  sectionIdentifier: keyof EnterpriseData
  errors: { [key: string]: string[] }
  isDisabled?: boolean
}

export const EnterpriseTextField = ({
  enterpriseData,
  setEnterpriseData,
  field,
  sectionIdentifier,
  isDisabled,
  errors,
}: EnterpriseFieldsProps) => (
  <div>
    <Label>{enterpriseFieldsMapping[field]}</Label>
    <div className="flex items-center">
      <SimpleInput
        id={field}
        disabled={isDisabled}
        onFocus={onTextareaFocus}
        value={
          (enterpriseData[sectionIdentifier] as Record<string, any>)[field]
        }
        onChange={(event) =>
          handleChangeTextValues(
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

export const EnterpriseNumberField = ({
  enterpriseData,
  setEnterpriseData,
  field,
  dataType,
  prefix,
  sectionIdentifier,
  isDisabled,
  errors,
}: EnterpriseFieldsProps & { dataType: string; prefix?: string }) => {
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
          value={
            ((enterpriseData[sectionIdentifier] as Record<string, any>)[
              field
            ] as string) ?? ''
          }
          onChange={(event) =>
            isInteger
              ? handleChangeIntegerValues(
                  field,
                  setEnterpriseData,
                  event,
                  sectionIdentifier,
                )
              : handleChangeDecimalValues(
                  field,
                  setEnterpriseData,
                  event,
                  sectionIdentifier,
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
  field,
  sectionIdentifier,
  isDisabled,
  errors,
}: Omit<EnterpriseFieldsProps, 'field'> & {
  field: { fieldName: string; options: any }
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
          value={
            (enterpriseData[sectionIdentifier] as Record<string, any>)[
              fieldName
            ]
          }
          onChange={(_, value) =>
            handleChangeSelectValues(
              fieldName,
              setEnterpriseData,
              value,
              sectionIdentifier,
            )
          }
          getOptionLabel={(option) => getOptionLabel(options, option)}
          {...defaultProps}
          {...(fieldName === 'subsector' && {
            FieldProps: {
              ...defaultProps.FieldProps,
              className: defaultProps.FieldProps.className + ' w-[21rem]',
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
  field,
  sectionIdentifier,
  isDisabled,
  errors,
}: EnterpriseFieldsProps) => (
  <div>
    <Label>{enterpriseFieldsMapping[field]} (max 500 characters)</Label>
    <div className="flex items-center">
      <TextareaAutosize
        disabled={isDisabled}
        onFocus={onTextareaFocus}
        value={
          (enterpriseData[sectionIdentifier] as Record<string, any>)[
            field
          ] as string
        }
        onChange={(event) =>
          handleChangeTextValues(
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

export const EnterpriseDateField = ({
  enterpriseData,
  setEnterpriseData,
  field,
  sectionIdentifier,
  isDisabled,
  errors,
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
            field,
            setEnterpriseData,
            event,
            sectionIdentifier,
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
  const errors = await error.json()

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

  enqueueSnackbar(<>An error occurred. Please try again.</>, {
    variant: 'error',
  })
}

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
