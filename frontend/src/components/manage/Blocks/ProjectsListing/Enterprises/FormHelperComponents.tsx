import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import {
  FormattedNumberInput,
  DateInput,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { FieldErrorIndicator } from '../HelperComponents'
import { STYLE } from '../../Replenishment/Inputs/constants'
import { enterpriseFieldsMapping } from './constants'
import { onTextareaFocus } from '../utils'
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
import {
  EnterpriseData,
  EnterprisesCommonProps,
  SetEnterpriseData,
} from '../interfaces'

import { TextareaAutosize } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { omit } from 'lodash'
import cx from 'classnames'
import dayjs from 'dayjs'

type EnterpriseFieldsProps = EnterprisesCommonProps & {
  enterpriseData: EnterpriseData
  setEnterpriseData: SetEnterpriseData<EnterpriseData>
  field: string
  sectionIdentifier: keyof EnterpriseData
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
          handleChangeTextValues<EnterpriseData>(
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
              ? handleChangeIntegerValues<EnterpriseData>(
                  field,
                  setEnterpriseData,
                  event,
                  sectionIdentifier,
                )
              : handleChangeDecimalValues<EnterpriseData>(
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
}: EnterprisesCommonProps & {
  enterpriseData: EnterpriseData
  setEnterpriseData: SetEnterpriseData<EnterpriseData>
  field: { fieldName: string; options: any }
  sectionIdentifier: keyof EnterpriseData
  isDisabled?: boolean
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
            handleChangeSelectValues<EnterpriseData>(
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
          handleChangeTextValues<EnterpriseData>(
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
          handleChangeDateValues<EnterpriseData>(
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
