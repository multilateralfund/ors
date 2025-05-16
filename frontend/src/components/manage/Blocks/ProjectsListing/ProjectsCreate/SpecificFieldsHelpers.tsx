import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { isOptionEqualToValue } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import {
  ProjectSpecificFields,
  FieldType,
  FieldHandler,
  OptionsType,
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

export const changeHandler: Record<FieldType, FieldHandler> = {
  text: (value, field, setState) => {
    setState((prevFields) => ({
      ...prevFields,
      [field]: value.target.value,
    }))
  },
  number: (value, field, setState) => {
    handleChangeNumberField(value, field, setState)
  },
  decimal: (value, field, setState) => {
    handleChangeDecimalField(value, field, setState)
  },
  drop_down: (value, field, setState) => {
    setState((prevFields) => ({
      ...prevFields,
      [field]: value?.id ?? null,
    }))
  },
  boolean: (value, field, setState) => {
    setState((prevFields) => ({
      ...prevFields,
      [field]: value,
    }))
  },
}

export const AutocompleteWidget = <T,>(
  fields: T,
  setFields: Dispatch<SetStateAction<T>>,
  field: ProjectSpecificFields,
) => {
  const options = formatOptions(field)
  const fieldName = field.field_name

  const value = fields[fieldName]
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
          changeHandler[field.data_type]<T>(value, fieldName, setFields)
        }
        getOptionLabel={(option) => {
          const field = fieldName === 'group' ? 'name_alt' : 'name'

          return isObject(option)
            ? get(option, field)
            : (find(options, { id: option }) as OptionsType)?.[field] || ''
        }}
        isOptionEqualToValue={isOptionEqualToValue}
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
) => (
  <div>
    <Label>{field.label}</Label>
    <TextareaAutosize
      value={fields[field.field_name] as string}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
        changeHandler[field.data_type]<T>(event, field.field_name, setFields)
      }
      className={textAreaClassname}
      minRows={2}
      tabIndex={-1}
    />
  </div>
)

const NumberWidget = <T,>(
  fields: T,
  setFields: Dispatch<SetStateAction<T>>,
  field: ProjectSpecificFields,
) => (
  <div>
    <Label>{field.label}</Label>
    <SimpleInput
      id={fields[field.field_name] as string}
      value={fields[field.field_name]}
      onChange={(value) =>
        changeHandler[field.data_type]<T>(value, field.field_name, setFields)
      }
      type="number"
      {...defaultPropsSimpleField}
    />
  </div>
)

const BooleanWidget = <T,>(
  fields: T,
  setFields: Dispatch<SetStateAction<T>>,
  field: ProjectSpecificFields,
) => (
  <div className="col-span-full flex w-full">
    <Label>{field.label}</Label>
    <Checkbox
      className="pb-1 pl-2 pt-0"
      checked={fields[field.field_name] as boolean}
      onChange={(_: React.SyntheticEvent, value) =>
        changeHandler[field.data_type]<T>(value, field.field_name, setFields)
      }
      sx={{
        color: 'black',
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
