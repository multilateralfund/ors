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
  disabledClassName,
} from '../constants'
import { canEditField, formatOptions } from '../utils'

import { Checkbox, TextareaAutosize } from '@mui/material'
import { find, get, isObject, isBoolean, isNil, isArray } from 'lodash'
import cx from 'classnames'

const getIsInputDisabled = (
  hasSubmitted: boolean,
  errors: { [key: string]: string[] } | { [key: string]: string[] }[],
  hasTrancheErrors: boolean,
  field: string,
  index?: number,
) => {
  const isError =
    isArray(errors) && !isNil(index)
      ? errors?.[index]?.[field]?.length > 0
      : !isArray(errors) && errors?.[field]?.length > 0

  return (
    hasSubmitted &&
    (isError || (field === 'Tranche number' && hasTrancheErrors))
  )
}

const getFieldDefaultProps = (
  isError: boolean,
  editableFields: string[],
  field: ProjectSpecificFields,
) => {
  const fieldName = field.write_field_name
  const isOdp = field.table === 'ods_odp'

  return {
    ...{
      ...defaultPropsSimpleField,
      className: cx(defaultPropsSimpleField.className, {
        'w-[125px]': isOdp,
        'border-red-500': isError,
        [disabledClassName]: !canEditField(editableFields, fieldName),
      }),
      containerClassName: cx(defaultPropsSimpleField.containerClassName, {
        'w-[125px]': isOdp,
      }),
    },
  }
}

const changeNestedField: FieldHandler = (
  value,
  field,
  setState,
  section,
  subField,
  index,
) => {
  if (!isNil(index) && subField) {
    setState((prevData) => {
      const sectionData = prevData[section] as Record<string, any>
      const subSectionData = sectionData[subField] || []

      subSectionData[index] = {
        ...subSectionData[index],
        [field]: value,
      }

      return {
        ...prevData,
        [section]: {
          ...prevData[section],
          [subField]: subSectionData,
        },
      }
    })
  }
}

export const changeField: FieldHandler = (value, field, setState, section) => {
  setState((prevData) => ({
    ...prevData,
    [section]: {
      ...prevData[section],
      [field]: value,
    },
  }))
}

const getValue = <T,>(
  fields: T,
  sectionIdentifier: keyof T,
  fieldName: string,
  subField?: string,
  index?: number,
) => {
  const sectionData = fields[sectionIdentifier] as Record<string, any>
  const subSectionData = sectionData[subField as string] || []

  return subField && !isNil(index)
    ? subSectionData?.[index]?.[fieldName]
    : sectionData[fieldName]
}

const onFieldChange: FieldHandler = (
  value,
  field,
  setState,
  section,
  subField,
  index,
) => {
  if (subField && !isNil(index)) {
    changeNestedField(value, field, setState, section, subField, index)
  } else {
    changeField(value, field, setState, section)
  }
}

export const changeHandler: Record<FieldType, FieldHandler> = {
  text: (value, field, setState, section, subField, index) => {
    const formattedVal = value.target.value
    onFieldChange(formattedVal, field, setState, section, subField, index)
  },
  number: (value, field, setState, section, subField, index) => {
    const formattedVal = value.target.value

    if (formattedVal === '' || !isNaN(parseInt(formattedVal))) {
      const finalVal = formattedVal ? parseInt(formattedVal) : null
      onFieldChange(finalVal, field, setState, section, subField, index)
    } else {
      value.preventDefault()
    }
  },
  decimal: (value, field, setState, section, subField, index) => {
    const val = value.target.value
    const formattedVal = val === '' ? null : val

    if (!isNaN(Number(formattedVal))) {
      onFieldChange(formattedVal, field, setState, section, subField, index)
    } else {
      value.preventDefault()
    }
  },
  drop_down: (value, field, setState, section, subField, index) => {
    const formattedVal = value?.id ?? null
    onFieldChange(formattedVal, field, setState, section, subField, index)
  },
  boolean: (value, field, setState, section, subField, index) => {
    onFieldChange(value, field, setState, section, subField, index)
  },
}

const identifier = 'projectSpecificFields'

export const AutocompleteWidget = <T,>(
  fields: T,
  setFields: Dispatch<SetStateAction<T>>,
  field: ProjectSpecificFields,
  errors: { [key: string]: string[] } | { [key: string]: string[] }[],
  hasTrancheErrors: boolean,
  hasSubmitted: boolean,
  editableFields: string[],
  sectionIdentifier: keyof T = identifier as keyof T,
  subField?: string,
  index?: number,
) => {
  const options = formatOptions(field)
  const fieldName = field.write_field_name
  const value = getValue(fields, sectionIdentifier, fieldName, subField, index)

  const formattedValue = isBoolean(value)
    ? find(options, { id: value }) || null
    : value

  return (
    <div className="flex h-full flex-col justify-between">
      <Label>{field.label}</Label>
      <Field
        widget="autocomplete"
        options={options}
        disabled={!canEditField(editableFields, field.write_field_name)}
        value={formattedValue}
        onChange={(_: React.SyntheticEvent, value) =>
          changeHandler[field.data_type]<T, SpecificFields>(
            value,
            fieldName,
            setFields,
            sectionIdentifier,
            subField,
            index,
          )
        }
        getOptionLabel={(option) => {
          const field = fieldName === 'group' ? 'name_alt' : 'name'

          return (
            (isObject(option)
              ? get(option, field)
              : (find(options, { id: option }) as OptionsType)?.[field]) || ''
          )
        }}
        Input={{
          error: getIsInputDisabled(
            hasSubmitted,
            errors,
            hasTrancheErrors,
            field.label,
            index,
          ),
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
  errors: { [key: string]: string[] } | { [key: string]: string[] }[],
  hasTrancheErrors: boolean,
  hasSubmitted: boolean,
  editableFields: string[],
  sectionIdentifier: keyof T = identifier as keyof T,
  subField?: string,
  index?: number,
) => {
  const fieldName = field.write_field_name
  const value = getValue(fields, sectionIdentifier, fieldName, subField, index)

  return (
    <div className="w-full md:w-auto">
      <Label>{field.label}</Label>
      <TextareaAutosize
        value={value as string}
        disabled={!canEditField(editableFields, field.write_field_name)}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
          changeHandler[field.data_type]<T, SpecificFields>(
            event,
            fieldName,
            setFields,
            sectionIdentifier,
            subField,
            index,
          )
        }
        className={cx(textAreaClassname, {
          'md:w-[255px] md:min-w-[255px]': field.table === 'ods_odp',
          'border-red-500': getIsInputDisabled(
            hasSubmitted,
            errors,
            hasTrancheErrors,
            field.label,
            index,
          ),
        })}
        minRows={2}
        tabIndex={-1}
      />
    </div>
  )
}

const NumberWidget = <T,>(
  fields: T,
  setFields: Dispatch<SetStateAction<T>>,
  field: ProjectSpecificFields,
  errors: { [key: string]: string[] } | { [key: string]: string[] }[],
  hasTrancheErrors: boolean,
  hasSubmitted: boolean,
  editableFields: string[],
  sectionIdentifier: keyof T = identifier as keyof T,
  subField?: string,
  index?: number,
) => {
  const fieldName = field.write_field_name
  const value = getValue(fields, sectionIdentifier, fieldName, subField, index)

  return (
    <div className="flex h-full flex-col justify-between">
      <Label>{field.label}</Label>
      <SimpleInput
        id={value as string}
        value={value ?? ''}
        disabled={!canEditField(editableFields, field.write_field_name)}
        type="text"
        onChange={(value) =>
          changeHandler[field.data_type]<T, SpecificFields>(
            value,
            field.write_field_name,
            setFields,
            sectionIdentifier,
            subField,
            index,
          )
        }
        {...getFieldDefaultProps(
          getIsInputDisabled(
            hasSubmitted,
            errors,
            hasTrancheErrors,
            field.label,
            index,
          ),
          editableFields,
          field,
        )}
      />
    </div>
  )
}

const BooleanWidget = <T,>(
  fields: T,
  setFields: Dispatch<SetStateAction<T>>,
  field: ProjectSpecificFields,
  errors: { [key: string]: string[] } | { [key: string]: string[] }[],
  hasTrancheErrors: boolean,
  hasSubmitted: boolean,
  editableFields: string[],
  sectionIdentifier: keyof T = identifier as keyof T,
  subField?: string,
  index?: number,
) => {
  const fieldName = field.write_field_name
  const value = getValue(fields, sectionIdentifier, fieldName, subField, index)

  return (
    <div className="col-span-full flex w-full">
      <Label>{field.label}</Label>
      <Checkbox
        className="pb-1 pl-2 pt-0"
        checked={value as boolean}
        disabled={!canEditField(editableFields, field.write_field_name)}
        onChange={(_: React.SyntheticEvent, value) =>
          changeHandler[field.data_type]<T, SpecificFields>(
            value,
            fieldName,
            setFields,
            sectionIdentifier,
            subField,
            index,
          )
        }
        sx={{
          color: getIsInputDisabled(
            hasSubmitted,
            errors,
            hasTrancheErrors,
            field.label,
            index,
          )
            ? 'red'
            : 'black',
        }}
      />
    </div>
  )
}

export const widgets = {
  drop_down: AutocompleteWidget,
  text: TextWidget,
  number: NumberWidget,
  decimal: NumberWidget,
  boolean: BooleanWidget,
}
