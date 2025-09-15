import { Dispatch, SetStateAction } from 'react'

import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { EnterpriseOverview, EnterprisesCommonProps } from '../interfaces'
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
import { enqueueSnackbar } from 'notistack'
import { filter, includes } from 'lodash'
import cx from 'classnames'

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
    <Label>{tableColumns[field]}</Label>
    <SimpleInput
      id={field}
      disabled={isDisabled}
      value={enterpriseData[field as keyof EnterpriseOverview]}
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
      containerClassName={
        defaultPropsSimpleField.containerClassName + ' !w-[35rem]'
      }
    />
  </div>
)

export const EnterpriseNumberField = <T,>({
  enterpriseData,
  setEnterpriseData,
  field,
  sectionIdentifier,
  isDisabled,
  hasSubmitted,
  errors,
}: PEnterpriseFieldsProps<T>) => (
  <div>
    <Label>{tableColumns[field]} (%)</Label>
    <SimpleInput
      id={field}
      disabled={isDisabled}
      value={enterpriseData[field as keyof EnterpriseOverview] ?? ''}
      onChange={(event) =>
        handleChangeNumericValues<T>(
          field,
          setEnterpriseData,
          event,
          sectionIdentifier,
        )
      }
      type="text"
      {...getFieldDefaultProps(hasSubmitted, errors[field], isDisabled)}
    />
  </div>
)

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
          handleChangeSelectValues<T>(
            fieldName,
            setEnterpriseData,
            value,
            isMultiple,
            sectionIdentifier,
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
    <Label>{tableColumns[field]}</Label>
    <TextareaAutosize
      disabled={isDisabled}
      value={enterpriseData[field as keyof EnterpriseOverview] as string}
      onChange={(event) =>
        handleChangeTextValues<T>(
          field,
          setEnterpriseData,
          event,
          sectionIdentifier,
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
