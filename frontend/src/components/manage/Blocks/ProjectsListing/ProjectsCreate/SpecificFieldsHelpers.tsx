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
  NestedFieldHandler,
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
import { find, get, isObject, isBoolean, isNil } from 'lodash'
import cx from 'classnames'

const getIsInputDisabled = (
  hasSubmitted: boolean,
  errors: { [key: string]: string[] } | { [key: string]: string[] }[],
  field: string,
  index?: number,
) => {
  let isError = false

  if (Array.isArray(errors) && !isNil(index)) {
    isError = errors?.[index]?.[field]?.length > 0
  } else if (!Array.isArray(errors)) {
    isError = errors?.[field]?.length > 0
  }

  return hasSubmitted && isError
}

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

const changeNestedField: NestedFieldHandler = (
  value,
  field,
  setState,
  section,
  subField,
  index,
) => {
  setState((prevData) => {
    const sectionData = prevData[section]
    const subSectionData = [
      ...((sectionData?.[subField as keyof typeof sectionData] as Record<
        string,
        any
      >[]) || []),
    ]

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

const changeField: FieldHandler = (value, field, setState, section) => {
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
  const sectionData = fields[sectionIdentifier]
  const subSectionData = sectionData[
    subField as keyof typeof sectionData
  ] as Record<string, any>[]

  if (subField && !isNil(index)) {
    const crtEntryData = subSectionData?.[index]
    return crtEntryData?.[fieldName as keyof typeof crtEntryData]
  } else {
    return sectionData[fieldName as keyof typeof sectionData]
  }
}

export const changeHandler: Record<FieldType, FieldHandler> = {
  text: (value, field, setState, section, subField, index) => {
    const formattedVal = value.target.value

    if (subField && !isNil(index)) {
      changeNestedField(formattedVal, field, setState, section, subField, index)
    } else {
      changeField(formattedVal, field, setState, section)
    }
  },
  number: (value, field, setState, section, subField, index) => {
    const formattedVal = value.target.value

    if (formattedVal === '' || !isNaN(parseInt(formattedVal))) {
      const finalVal = formattedVal ? parseInt(formattedVal) : ''

      if (subField && !isNil(index)) {
        changeNestedField(finalVal, field, setState, section, subField, index)
      } else {
        changeField(finalVal, field, setState, section)
      }
    } else {
      value.preventDefault()
    }
    handleChangeNumberField(value, field, setState, section)
  },
  decimal: (value, field, setState, section, subField, index) => {
    const formattedVal = value.target.value

    if (!isNaN(Number(formattedVal))) {
      if (subField && !isNil(index)) {
        changeNestedField(
          formattedVal,
          field,
          setState,
          section,
          subField,
          index,
        )
      } else {
        changeField(formattedVal, field, setState, section)
      }
    } else {
      value.preventDefault()
    }
  },
  drop_down: (value, field, setState, section, subField, index) => {
    const formattedVal = value?.id ?? null

    if (subField && !isNil(index)) {
      changeNestedField(formattedVal, field, setState, section, subField, index)
    } else {
      changeField(formattedVal, field, setState, section)
    }
  },
  boolean: (value, field, setState, section, subField, index) => {
    if (subField && !isNil(index)) {
      changeNestedField(value, field, setState, section, subField, index)
    } else {
      changeField(value, field, setState, section)
    }
  },
}

const identifier = 'projectSpecificFields'

export const AutocompleteWidget = <T,>(
  fields: T,
  setFields: Dispatch<SetStateAction<T>>,
  field: ProjectSpecificFields,
  errors: { [key: string]: string[] } | { [key: string]: string[] }[],
  hasSubmitted: boolean,
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
          error: getIsInputDisabled(hasSubmitted, errors, field.label, index),
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
  hasSubmitted: boolean,
  sectionIdentifier: keyof T = identifier as keyof T,
  subField?: string,
  index?: number,
) => {
  const fieldName = field.write_field_name
  const value = getValue(fields, sectionIdentifier, fieldName, subField, index)

  return (
    <div>
      <Label>{field.label}</Label>
      <TextareaAutosize
        value={value as string}
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
          'border-red-500': getIsInputDisabled(
            hasSubmitted,
            errors,
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
  hasSubmitted: boolean,
  sectionIdentifier: keyof T = identifier as keyof T,
  subField?: string,
  index?: number,
) => {
  const fieldName = field.write_field_name
  const value = getValue(fields, sectionIdentifier, fieldName, subField, index)

  return (
    <div>
      <Label>{field.label}</Label>
      <SimpleInput
        id={value as string}
        value={value ?? ''}
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
        type="text"
        {...getFieldDefaultProps(
          getIsInputDisabled(hasSubmitted, errors, field.label, index),
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
  hasSubmitted: boolean,
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
          color: getIsInputDisabled(hasSubmitted, errors, field.label, index)
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
