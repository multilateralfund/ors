import React from 'react'

export interface IFieldProps extends React.PropsWithChildren {
  id: string
  label: string
}

export interface ISingleSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  defaultValue?: string
  hasClear?: boolean
  onChange?: (evt: React.ChangeEvent<HTMLSelectElement>) => void
  onClear?: () => void
}

export interface ISearchableSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  hasClear?: boolean
  hideFirstOption?: boolean
  onChange: (value: string) => void
  pickerClassName?: string
  value: string
}

export interface IWrappedSearchableSelectProps
  extends Omit<ISearchableSelectProps, 'onChange' | 'value'> {
  defaultValue?: ISearchableSelectProps['value']
  onChange?: ISearchableSelectProps['onChange']
  value?: ISearchableSelectProps['value']
}

export interface IMultiSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  defaultValue?: string[]
  hasClear?: boolean
  onChange?: (newValue: string[]) => void
}

export interface IClearButtonProps {
  className?: string
  onClick: React.MouseEventHandler
}

export interface IDateInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
}

export interface INumberInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'inputMode' | 'type'
  > {}

export interface IFormattedNumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  decimalDigits?: number
  onlyNumber?: boolean
  value?: number | string
  withoutInitialValue?: boolean
}

export interface DateRangeInputProps
  extends Omit<IDateInputProps, 'onChange' | 'value'> {
  initialEnd: string
  initialStart: string
  onChange: (start: string, end: string) => void
}
