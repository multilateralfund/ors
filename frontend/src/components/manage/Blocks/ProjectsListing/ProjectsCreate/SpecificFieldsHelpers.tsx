import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import Field from '@ors/components/manage/Form/Field'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import {
  ProjectSpecificFields,
  FieldType,
  FieldHandler,
  OptionsType,
  SpecificFields,
} from '../interfaces'
import {
  defaultProps,
  defaultPropsSimpleField,
  textAreaClassname,
  additionalProperties,
} from '../constants'
import {
  formatOptions,
  handleChangeDecimalField,
  handleChangeNumberField,
} from '../utils'

import { Checkbox, TextareaAutosize } from '@mui/material'
import { find, get, isObject, isBoolean } from 'lodash'
import cx from 'classnames'

const getIsInputDisabled = (
  hasSubmitted: boolean,
  errors: { [key: string]: string[] },
  field: string,
) => hasSubmitted && errors[field]?.length > 0

const getFieldDefaultProps = (isError: boolean) => {
  return {
    ...{
      ...defaultPropsSimpleField,
      className: cx(defaultPropsSimpleField.className, {
        'border-red-500': isError,
      }),
    },
  }
}

export const changeHandler: Record<FieldType, FieldHandler> = {
  text: (value, field, setState, section) => {
    setState((prevData) => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [field]: value.target.value,
      },
    }))
  },
  number: (value, field, setState, section) => {
    handleChangeNumberField(value, field, setState, section)
  },
  decimal: (value, field, setState, section) => {
    handleChangeDecimalField(value, field, setState, section)
  },
  drop_down: (value, field, setState, section) => {
    setState((prevData) => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [field]: value?.id ?? null,
      },
    }))
  },
  boolean: (value, field, setState, section) => {
    setState((prevData) => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [field]: value,
      },
    }))
  },
}

const identifier = 'projectSpecificFields'

export const AutocompleteWidget = <T,>(
  fields: T,
  setFields: Dispatch<SetStateAction<T>>,
  field: ProjectSpecificFields,
  errors: { [key: string]: string[] },
  hasSubmitted: boolean,
  sectionIdentifier: keyof T = identifier as keyof T,
) => {
  const options = formatOptions(field)
  const fieldName = field.write_field_name

  const value = fields[sectionIdentifier][fieldName]
  const formattedValue = isBoolean(value)
    ? find(options, { id: value }) || null
    : value

  return (
    <div>
      <Label>{field.label}</Label>
      <Field
        widget="autocomplete"
        options={options}
        value={formattedValue}
        onChange={(_: React.SyntheticEvent, value) =>
          changeHandler[field.data_type]<T, SpecificFields>(
            value,
            fieldName,
            setFields,
            sectionIdentifier,
          )
        }
        getOptionLabel={(option) => {
          const field = fieldName === 'group' ? 'name_alt' : 'name'

          return isObject(option)
            ? get(option, field)
            : (find(options, { id: option }) as OptionsType)?.[field] || ''
        }}
        Input={{
          error: getIsInputDisabled(hasSubmitted, errors, field.label),
        }}
        {...defaultProps}
        {...(additionalProperties[fieldName] ?? {})}
      />
    </div>
  )
}

export const TextWidget = <T,>(
  fields: T,
  setFields: Dispatch<SetStateAction<T>>,
  field: ProjectSpecificFields,
  errors: { [key: string]: string[] },
  hasSubmitted: boolean,
  sectionIdentifier: keyof T = identifier as keyof T,
) => (
  <div>
    <Label>{field.label}</Label>
    <TextareaAutosize
      value={fields[sectionIdentifier][field.write_field_name] as string}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
        changeHandler[field.data_type]<T, SpecificFields>(
          event,
          field.write_field_name,
          setFields,
          sectionIdentifier,
        )
      }
      className={cx(textAreaClassname, {
        'border-red-500': getIsInputDisabled(hasSubmitted, errors, field.label),
      })}
      minRows={2}
      tabIndex={-1}
    />
  </div>
)

const NumberWidget = <T,>(
  fields: T,
  setFields: Dispatch<SetStateAction<T>>,
  field: ProjectSpecificFields,
  errors: { [key: string]: string[] },
  hasSubmitted: boolean,
  sectionIdentifier: keyof T = identifier as keyof T,
) => (
  <div>
    <Label>{field.label}</Label>
    <SimpleInput
      id={fields[sectionIdentifier][field.write_field_name] as string}
      value={fields[sectionIdentifier][field.write_field_name] ?? ''}
      onChange={(value) =>
        changeHandler[field.data_type]<T, SpecificFields>(
          value,
          field.write_field_name,
          setFields,
          sectionIdentifier,
        )
      }
      type="text"
      {...getFieldDefaultProps(
        getIsInputDisabled(hasSubmitted, errors, field.label),
      )}
    />
  </div>
)

const BooleanWidget = <T,>(
  fields: T,
  setFields: Dispatch<SetStateAction<T>>,
  field: ProjectSpecificFields,
  errors: { [key: string]: string[] },
  hasSubmitted: boolean,
  sectionIdentifier: keyof T = identifier as keyof T,
) => (
  <div className="col-span-full flex w-full">
    <Label>{field.label}</Label>
    <Checkbox
      className="pb-1 pl-2 pt-0"
      checked={fields[sectionIdentifier][field.write_field_name] as boolean}
      onChange={(_: React.SyntheticEvent, value) =>
        changeHandler[field.data_type]<T, SpecificFields>(
          value,
          field.write_field_name,
          setFields,
          sectionIdentifier,
        )
      }
      sx={{
        color: getIsInputDisabled(hasSubmitted, errors, field.label)
          ? 'red'
          : 'black',
      }}
    />
  </div>
)

export const widgets = {
  drop_down: AutocompleteWidget,
  text: TextWidget,
  number: NumberWidget,
  decimal: NumberWidget,
  boolean: BooleanWidget,
}
