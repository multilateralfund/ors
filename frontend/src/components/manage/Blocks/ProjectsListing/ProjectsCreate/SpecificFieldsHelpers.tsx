import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import {
  DateInput,
  FormattedNumberInput,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { STYLE } from '../../Replenishment/Inputs/constants'
import { FieldErrorIndicator } from '../HelperComponents'
import { canEditField, formatFieldLabel, formatOptions } from '../utils'
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

import { find, get, isObject, isBoolean, isNil, omit } from 'lodash'
import { Checkbox, TextareaAutosize } from '@mui/material'
import cx from 'classnames'
import dayjs from 'dayjs'

const getFieldDefaultProps = (
  editableFields: string[],
  field: ProjectSpecificFields,
) => {
  const fieldName = field.write_field_name
  const isOdp = field.table === 'ods_odp' && field.section !== 'Approval'

  return {
    ...{
      ...defaultPropsSimpleField,
      className: cx('!ml-0 h-10', defaultPropsSimpleField.className, {
        'w-[125px]': isOdp,
        [disabledClassName]: !canEditField(editableFields, fieldName),
        '!flex-grow-0': field.data_type === 'date',
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
  editableFields: string[],
  sectionIdentifier: keyof T = identifier as keyof T,
  subField?: string,
  index?: number,
  hasField?: boolean,
) => {
  const options = formatOptions(
    field,
    hasField ? fields[sectionIdentifier] : undefined,
  )
  const fieldName = field.write_field_name
  const value = getValue(fields, sectionIdentifier, fieldName, subField, index)

  const formattedValue = isBoolean(value)
    ? find(options, { id: value }) || null
    : value

  const normalizedValue =
    fieldName === 'ods_display_name'
      ? options.find((opt) => opt.id === value) || null
      : formattedValue

  const isDisabledImpactField =
    field.section === 'Impact' && !canEditField(editableFields, fieldName)

  return (
    <div
      className={cx('flex h-full flex-col', {
        'justify-between': field.table !== 'ods_odp',
      })}
    >
      <Label className={cx({ italic: isDisabledImpactField })}>
        {field.label} {isDisabledImpactField ? ' (planned)' : ''}
      </Label>
      <div className="flex items-center">
        <Field
          widget="autocomplete"
          options={options}
          disabled={!canEditField(editableFields, fieldName)}
          value={normalizedValue}
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
            const field =
              fieldName === 'group'
                ? 'name_alt'
                : fieldName === 'ods_display_name'
                  ? 'label'
                  : 'name'

            return (
              (isObject(option)
                ? get(option, field)
                : (find(options, { id: option }) as OptionsType)?.[field]) || ''
            )
          }}
          {...defaultProps}
          {...(additionalProperties[fieldName] ?? {})}
          {...(field.section === 'Impact'
            ? {
                FieldProps: {
                  className: defaultProps.FieldProps.className + ' !w-40',
                },
              }
            : {})}
        />
        <FieldErrorIndicator
          errors={
            !isNil(index)
              ? (errors as { [key: string]: string[] }[])[index]
              : errors
          }
          field={field.label}
        />
      </div>
    </div>
  )
}

export const TextWidget = <T,>(
  fields: T,
  setFields: Dispatch<SetStateAction<T>>,
  field: ProjectSpecificFields,
  errors: { [key: string]: string[] } | { [key: string]: string[] }[],
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
      <div className="flex items-center">
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
          {...getFieldDefaultProps(editableFields, field)}
          containerClassName={
            defaultPropsSimpleField.containerClassName +
            (fieldName === 'programme_officer'
              ? textFieldClassName + ' max-w-[370px]'
              : '')
          }
        />
        <FieldErrorIndicator
          errors={
            !isNil(index)
              ? (errors as { [key: string]: string[] }[])[index]
              : errors
          }
          field={field.label}
        />
      </div>
    </div>
  )
}

export const TextAreaWidget = <T,>(
  fields: T,
  setFields: Dispatch<SetStateAction<T>>,
  field: ProjectSpecificFields,
  errors: { [key: string]: string[] } | { [key: string]: string[] }[],
  editableFields: string[],
  sectionIdentifier: keyof T = identifier as keyof T,
  subField?: string,
  index?: number,
) => {
  const fieldName = field.write_field_name
  const value = getValue(fields, sectionIdentifier, fieldName, subField, index)
  const isOdsReplacement = fieldName === 'ods_replacement'

  return (
    <div className={cx('w-full', { 'md:w-auto': field.table === 'ods_odp' })}>
      <Label>{field.label} (max 500 characters)</Label>
      <div className="flex items-center">
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
            '!min-h-[27px] !min-w-64 !pb-1.5': isOdsReplacement,
          })}
          maxLength={500}
          style={STYLE}
          minRows={isOdsReplacement ? 1 : 2}
          tabIndex={-1}
        />
        <FieldErrorIndicator
          errors={
            !isNil(index)
              ? (errors as { [key: string]: string[] }[])[index]
              : errors
          }
          field={field.label}
        />
      </div>
    </div>
  )
}

const NumberWidget = <T,>(
  fields: T,
  setFields: Dispatch<SetStateAction<T>>,
  field: ProjectSpecificFields,
  errors: { [key: string]: string[] } | { [key: string]: string[] }[],
  editableFields: string[],
  sectionIdentifier: keyof T = identifier as keyof T,
  subField?: string,
  index?: number,
) => {
  const fieldName = field.write_field_name
  const value = getValue(fields, sectionIdentifier, fieldName, subField, index)

  const isDisabledImpactField =
    field.section === 'Impact' && !canEditField(editableFields, fieldName)

  return (
    <div
      className={cx('flex h-full flex-col', {
        'justify-between':
          field.table !== 'ods_odp' || field.section === 'Approval',
      })}
    >
      <Label className={cx({ italic: isDisabledImpactField })}>
        {formatFieldLabel(field.label)}
        {isDisabledImpactField ? ' (planned)' : ''}
      </Label>
      <div className="flex items-center">
        <FormattedNumberInput
          id={fieldName}
          value={value ?? ''}
          withoutDefaultValue={true}
          decimalDigits={field.data_type === 'number' ? 0 : 2}
          disabled={!canEditField(editableFields, fieldName)}
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
          {...getFieldDefaultProps(editableFields, field)}
        />
        <div
          className={cx({
            'w-8': field.section === 'Approval' && field.table === 'ods_odp',
          })}
        >
          <FieldErrorIndicator
            errors={
              !isNil(index)
                ? (errors as { [key: string]: string[] }[])[index]
                : errors
            }
            field={field.label}
          />
        </div>
      </div>
    </div>
  )
}

const BooleanWidget = <T,>(
  fields: T,
  setFields: Dispatch<SetStateAction<T>>,
  field: ProjectSpecificFields,
  errors: { [key: string]: string[] } | { [key: string]: string[] }[],
  editableFields: string[],
  sectionIdentifier: keyof T = identifier as keyof T,
  subField?: string,
  index?: number,
) => {
  const fieldName = field.write_field_name
  const value = getValue(fields, sectionIdentifier, fieldName, subField, index)

  const isDisabledImpactField =
    field.section === 'Impact' && !canEditField(editableFields, fieldName)

  return (
    <div className="col-span-full flex w-full">
      <Label className={cx({ italic: isDisabledImpactField })}>
        {field.label}
        {isDisabledImpactField ? ' (planned)' : ''}
      </Label>
      <div className="flex items-center">
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
          sx={{ color: 'black' }}
        />
        <FieldErrorIndicator
          errors={
            !isNil(index)
              ? (errors as { [key: string]: string[] }[])[index]
              : errors
          }
          field={field.label}
        />
      </div>
    </div>
  )
}

const DateWidget = <T,>(
  fields: T,
  setFields: Dispatch<SetStateAction<T>>,
  field: ProjectSpecificFields,
  errors: { [key: string]: string[] } | { [key: string]: string[] }[],
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
      <div className="flex items-center">
        <div className="w-40">
          <DateInput
            id={fieldName}
            value={value}
            disabled={!canEditField(editableFields, fieldName)}
            formatValue={(value) => dayjs(value).format('DD/MM/YYYY')}
            onChange={(value) => {
              changeHandler[field.data_type]<T, SpecificFields>(
                value,
                fieldName,
                setFields,
                sectionIdentifier,
                subField,
                index,
              )

              if (fieldName === 'date_completion') {
                changeHandler[field.data_type]<T, SpecificFields>(
                  value,
                  'project_end_date' as keyof SpecificFields,
                  setFields,
                  'crossCuttingFields' as keyof T,
                  subField,
                  index,
                )
              }
            }}
            {...omit(getFieldDefaultProps(editableFields, field), [
              'containerClassName',
            ])}
          />
        </div>
        <FieldErrorIndicator
          errors={
            !isNil(index)
              ? (errors as { [key: string]: string[] }[])[index]
              : errors
          }
          field={field.label}
        />
      </div>
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
