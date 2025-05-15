import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { isOptionEqualToValue } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import {
  ProjectSpecificFields,
  FieldType,
  SpecificFields,
  CrossCuttingFields,
} from '../interfaces'
import {
  additionalProperties,
  defaultProps,
  defaultPropsSimpleField,
  textAreaClassname,
} from '../constants'
import {
  formatOptions,
  handleChangeDecimalField,
  handleChangeNumberField,
} from '../utils'

import { Checkbox, TextareaAutosize } from '@mui/material'
import { find, get, isObject, reduce, isBoolean } from 'lodash'

export const handler: Record<
  FieldType,
  (
    value: any,
    field: keyof SpecificFields | keyof CrossCuttingFields,
    setProjectSpecificFields: Dispatch<SetStateAction<SpecificFields>>,
  ) => void
> = {
  text: (value, field, setProjectSpecificFields) => {
    setProjectSpecificFields((prevFilters) => ({
      ...prevFilters,
      [field]: value.target.value,
    }))
  },
  number: (value, field, setProjectSpecificFields) => {
    handleChangeNumberField(value, field, setProjectSpecificFields)
  },
  decimal: (value, field, setProjectSpecificFields) => {
    handleChangeDecimalField(value, field, setProjectSpecificFields)
  },
  drop_down: (value, field, setProjectSpecificFields) => {
    setProjectSpecificFields((prevFilters) => ({
      ...prevFilters,
      [field]: value?.id ?? null,
    }))
  },
  boolean: (value, field, setProjectSpecificFields) => {
    setProjectSpecificFields((prevFilters) => ({
      ...prevFilters,
      [field]: value,
    }))
  },
}

const getOptionLabel = (
  data: any,
  option: any,
  labelField: string = 'name',
  field: string = 'id',
) =>
  isObject(option)
    ? get(option, labelField)
    : find(data, { [field]: option })[labelField] || ''

export const getDefaultValFields = (fields: any) =>
  reduce(
    fields,
    (acc: any, field) => {
      acc[field.field_name] = field.data_type === 'drop_down' ? null : ''
      return acc
    },
    {},
  )

export const AutocompleteWidget = (
  field: ProjectSpecificFields,
  projectSpecificFields: SpecificFields,
  setProjectSpecificFields: Dispatch<SetStateAction<SpecificFields>>,
) => {
  const options = formatOptions(field)
  const fieldName = field.field_name
  const value = projectSpecificFields[fieldName]
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
          handler[field.data_type](value, fieldName, setProjectSpecificFields)
        }
        getOptionLabel={(option: any) =>
          getOptionLabel(
            options,
            option,
            fieldName === 'group' ? 'name_alt' : 'name',
          )
        }
        isOptionEqualToValue={isOptionEqualToValue}
        {...defaultProps}
        {...(additionalProperties[fieldName] as any)}
      />
    </div>
  )
}

export const TextWidget = (
  field: ProjectSpecificFields,
  projectSpecificFields: SpecificFields,
  setProjectSpecificFields: Dispatch<SetStateAction<SpecificFields>>,
) => (
  <div>
    <Label>{field.label}</Label>
    <TextareaAutosize
      value={projectSpecificFields[field.field_name] as string}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
        handler[field.data_type](
          event,
          field.field_name,
          setProjectSpecificFields,
        )
      }
      className={textAreaClassname}
      minRows={2}
      tabIndex={-1}
    />
  </div>
)

const NumberWidget = (
  field: ProjectSpecificFields,
  projectSpecificFields: SpecificFields,
  setProjectSpecificFields: Dispatch<SetStateAction<SpecificFields>>,
) => (
  <div>
    <Label>{field.label}</Label>
    <SimpleInput
      id={projectSpecificFields[field.field_name] as string}
      value={projectSpecificFields[field.field_name]}
      onChange={(value) =>
        handler[field.data_type](
          value,
          field.field_name,
          setProjectSpecificFields,
        )
      }
      type="number"
      {...defaultPropsSimpleField}
    />
  </div>
)

const BooleanWidget = (
  field: ProjectSpecificFields,
  projectSpecificFields: SpecificFields,
  setProjectSpecificFields: Dispatch<SetStateAction<SpecificFields>>,
) => (
  <div className="col-span-full flex w-full">
    <Label>{field.label}</Label>
    <Checkbox
      className="pb-1 pl-2 pt-0"
      checked={projectSpecificFields[field.field_name] as boolean}
      onChange={(_: React.SyntheticEvent, value) =>
        handler[field.data_type](
          value,
          field.field_name,
          setProjectSpecificFields,
        )
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
