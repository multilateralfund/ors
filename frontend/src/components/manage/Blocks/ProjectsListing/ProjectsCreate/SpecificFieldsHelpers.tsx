import {
  ProjectSpecificFields,
  FieldType,
  SpecificFields,
  OdsOdpFields,
} from '../interfaces'
import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import {
  defaultProps,
  defaultPropsSimpleField,
  textAreaClassname,
  widgetsMapping,
} from '../constants'
import { find, get, isArray, isObject, map } from 'lodash'
import { Checkbox, TextareaAutosize } from '@mui/material'
import { handleChangeDecimalField, handleChangeNumberField } from '../utils'

export const handler: Record<
  FieldType,
  (
    value: any,
    field: string,
    setProjectSpecificFields: React.Dispatch<
      React.SetStateAction<SpecificFields | OdsOdpFields>
    >,
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
      //  !isNil(is_sme?.value) ? is_sme?.value : null,
    }))
  },
  boolean: (value, field, setProjectSpecificFields) => {
    setProjectSpecificFields((prevFilters) => ({
      ...prevFilters,
      [field]: value,
    }))
  },
}

const getOptionLabel = (data: any, option: any, field: string = 'id') =>
  isObject(option)
    ? get(option, 'name')
    : find(data, { [field]: option })?.name || ''

export const AutocompleteWidget = (
  field: ProjectSpecificFields,
  projectSpecificFields: SpecificFields | OdsOdpFields,
  setProjectSpecificFields: React.Dispatch<
    React.SetStateAction<SpecificFields | OdsOdpFields>
  >,
) => {
  const options = map(field.options, (option) =>
    isArray(option) ? { id: option[0], name: option[1] } : option,
  )

  return (
    <div>
      <Label>{field.label}</Label>
      <Field
        widget="autocomplete"
        options={options}
        value={projectSpecificFields[field.field_name]}
        onChange={(_: React.SyntheticEvent, value) =>
          handler[field.data_type](
            value,
            field.field_name,
            setProjectSpecificFields,
          )
        }
        getOptionLabel={(option: any) => getOptionLabel(options, option)}
        {...defaultProps}
      />
    </div>
  )
}

export const TextWidget = (
  field: ProjectSpecificFields,
  projectSpecificFields: SpecificFields | OdsOdpFields,
  setProjectSpecificFields: React.Dispatch<
    React.SetStateAction<SpecificFields | OdsOdpFields>
  >,
) => (
  <div>
    <Label>{field.label}</Label>
    <TextareaAutosize
      value={projectSpecificFields[field.field_name]}
      onChange={(event) =>
        handler[field.data_type](
          event,
          field.field_name,
          setProjectSpecificFields,
        )
      }
      className={textAreaClassname + ' !min-h-[20px] w-[415px]'}
      minRows={2}
      tabIndex={-1}
    />
  </div>
)

const NumberWidget = (
  field: ProjectSpecificFields,
  projectSpecificFields: SpecificFields | OdsOdpFields,
  setProjectSpecificFields: React.Dispatch<
    React.SetStateAction<SpecificFields | OdsOdpFields>
  >,
) => (
  <div>
    <Label>{field.label}</Label>
    <SimpleInput
      id={projectSpecificFields[field.field_name]}
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
  projectSpecificFields: SpecificFields | OdsOdpFields,
  setProjectSpecificFields: React.Dispatch<
    React.SetStateAction<SpecificFields | OdsOdpFields>
  >,
) => (
  <div className="flex w-full">
    <Label>{field.label}</Label>
    <Checkbox
      className="pb-1 pl-2 pt-0"
      checked={projectSpecificFields[field.field_name]}
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
