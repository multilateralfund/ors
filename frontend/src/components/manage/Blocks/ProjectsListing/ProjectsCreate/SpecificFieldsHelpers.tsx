import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { DateInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { canEditField, formatOptions } from '../utils'
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
  textFieldClassName,
} from '../constants'

import { find, get, isObject, isBoolean, isNil, isArray } from 'lodash'
import { Checkbox, TextareaAutosize } from '@mui/material'
import cx from 'classnames'
import dayjs from 'dayjs'

export const getIsInputDisabled = (
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
        '!ml-0 h-10': field.data_type === 'date',
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
  date: (value, field, setState, section, subField, index) => {
    const formattedVal = value.target.value || null
    onFieldChange(formattedVal, field, setState, section, subField, index)
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
        disabled={!canEditField(editableFields, fieldName)}
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
    <div
      className={cx({
        'w-full': fieldName === 'programme_officer',
      })}
    >
      <Label>{field.label}</Label>
      <SimpleInput
        id={fieldName}
        value={value}
        type="text"
        disabled={!canEditField(editableFields, fieldName)}
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
        containerClassName={
          defaultPropsSimpleField.containerClassName +
          (fieldName === 'programme_officer' ? textFieldClassName : '')
        }
      />
    </div>
  )
}

export const TextAreaWidget = <T,>(
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
        disabled={!canEditField(editableFields, fieldName)}
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
        className={cx(textAreaClassname, 'max-w-[415px]', {
          'md:min-w-[415px]': field.table === 'ods_odp',
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
        id={fieldName}
        value={value ?? ''}
        disabled={!canEditField(editableFields, fieldName)}
        type="text"
        onChange={(value) =>
          changeHandler[field.data_type]<T, SpecificFields>(
            value,
            fieldName,
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
        checked={Boolean(value)}
        disabled={!canEditField(editableFields, fieldName)}
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

const DateWidget = <T,>(
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
    <div>
      <Label>{field.label}</Label>
      <DateInput
        id={fieldName}
        value={value}
        disabled={!canEditField(editableFields, fieldName)}
        formatValue={(value) => dayjs(value).format('MM/DD/YYYY')}
        onChange={(value) =>
          changeHandler[field.data_type]<T, SpecificFields>(
            value,
            fieldName,
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

export const widgets = {
  drop_down: AutocompleteWidget,
  text: TextAreaWidget,
  simpleText: TextWidget,
  number: NumberWidget,
  decimal: NumberWidget,
  boolean: BooleanWidget,
  date: DateWidget,
}
