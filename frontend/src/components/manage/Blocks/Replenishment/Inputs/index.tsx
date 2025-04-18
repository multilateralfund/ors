import type {
  TriggerButtonProps,
  YearRangeWidgetProps,
} from '@ors/components/manage/Widgets/YearRangeWidget'
import type { MouseEvent } from 'react'

import React from 'react'

import NumberInput from '@ors/components/manage/Blocks/Replenishment/Inputs/NumberInput'
import YearRangeWidget from '@ors/components/manage/Widgets/YearRangeWidget'

import PopoverInput from '../StatusOfTheFund/editDialogs/PopoverInput'
import { IPopoverInputProps } from '../StatusOfTheFund/types'
import DateInput from './DateInput'
import FormattedNumberInput from './FormattedNumberInput'
import Input from './Input'
import MultiSelect from './MultiSelect'
import SearchableSelect from './SearchableSelect'
import Select from './Select'
import { STYLE } from './constants'
import {
  IClearButtonProps,
  IDateInputProps,
  IFieldProps,
  IFormattedNumberInputProps,
  IMultiSelectProps,
  INumberInputProps,
  ISingleSelectProps,
  IWrappedSearchableSelectProps,
} from './types'

export {
  DateInput,
  FormattedNumberInput,
  Input,
  MultiSelect,
  SearchableSelect,
  Select,
}

export type {
  IClearButtonProps,
  IDateInputProps,
  IFieldProps,
  IFormattedNumberInputProps,
  IMultiSelectProps,
  IWrappedSearchableSelectProps,
}

export function Field(props: IFieldProps) {
  const { id, children, label } = props

  return (
    <div className="my-2 flex items-center">
      <label className="inline-block w-48" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}
export function FieldTextLine(props: { label: string; text: string }) {
  const { label, text } = props

  return (
    <div className="my-2 flex items-center">
      <label className="inline-block w-48">{label}</label>
      <Input
        className="border-transparent !px-0"
        readOnly={true}
        value={text}
      />
    </div>
  )
}
export function FieldSelect(props: IFieldProps & ISingleSelectProps) {
  const { id, children, label, ...rest } = props
  return (
    <Field id={id} label={label}>
      <Select id={id} {...rest}>
        {children}
      </Select>
    </Field>
  )
}

export function FieldMultiSelect(props: IFieldProps & IMultiSelectProps) {
  const { id, children, label, ...rest } = props
  return (
    <Field id={id} label={label}>
      <MultiSelect id={id} {...rest}>
        {children}
      </MultiSelect>
    </Field>
  )
}

export function FieldSearchableSelect(
  props: IFieldProps & IWrappedSearchableSelectProps,
) {
  const { id, children, label, ...rest } = props
  return (
    <Field id={id} label={label}>
      <SearchableSelect id={id} {...rest}>
        {children}
      </SearchableSelect>
    </Field>
  )
}

export function FieldPopoverInput(props: IFieldProps & IPopoverInputProps) {
  const { id, label, ...rest } = props

  const preventParentClick = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div onClick={preventParentClick}>
      <Field id={id} label={label}>
        <div className="relative">
          <PopoverInput {...rest} />
        </div>
      </Field>
    </div>
  )
}

export function FieldInput(
  props: IFieldProps & React.InputHTMLAttributes<HTMLInputElement>,
) {
  const { id, children, label, ...rest } = props
  return (
    <Field id={id} label={label}>
      <Input id={id} {...rest} />
    </Field>
  )
}

export function FieldNumberInput(props: IFieldProps & INumberInputProps) {
  const { id, children, label, ...rest } = props
  return (
    <Field id={id} label={label}>
      <NumberInput id={id} {...rest} />
    </Field>
  )
}

export function FieldWrappedNumberInput(
  props: IFieldProps & INumberInputProps,
) {
  const { id, children, label, ...rest } = props
  return (
    <Field id={id} label={label}>
      <div className="relative">
        <NumberInput id={id} {...rest} />
      </div>
    </Field>
  )
}

export function FieldTextInput(
  props: IFieldProps & React.InputHTMLAttributes<HTMLInputElement>,
) {
  const { id, children, label, ...rest } = props
  return (
    <Field id={id} label={label}>
      <div className="relative">
        <Input id={id} {...rest} />
      </div>
    </Field>
  )
}

export function FieldDateInput(props: IDateInputProps & IFieldProps) {
  const { id, label, ...rest } = props
  return (
    <Field id={id} label={label}>
      <DateInput id={id} {...rest} />
    </Field>
  )
}

export function FieldFormattedNumberInput(
  props: IFieldProps & IFormattedNumberInputProps,
) {
  const { id, label, ...rest } = props
  return (
    <Field id={id} label={label}>
      <FormattedNumberInput id={id} {...rest} />
    </Field>
  )
}

interface IYearRangeLabelProps {
  value?: number[]
}

function YearRangeLabel(props: IYearRangeLabelProps) {
  const { value } = props
  return value && value.length ? (
    <div className="text-primary">
      Year range: {value[0]} - {value[1]}
    </div>
  ) : (
    <div className="text-gray-400">Select a range of years</div>
  )
}

function YearRangeButton(props: TriggerButtonProps) {
  const { label, onClick, open, uniqueId } = props
  const ariaDescribedBy = open ? `range-widget-${uniqueId}` : undefined
  return (
    <button
      className="relative flex w-full min-w-44 cursor-pointer items-center rounded-lg border border-solid border-primary bg-white px-4 py-2"
      aria-describedby={ariaDescribedBy}
      style={STYLE}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export function YearRangeInput(
  props: Omit<YearRangeWidgetProps, 'button' | 'label'>,
) {
  return (
    <YearRangeWidget
      {...props}
      Button={YearRangeButton}
      label={<YearRangeLabel value={props.value} />}
    />
  )
}
