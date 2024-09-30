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
  defaultValue?: string
  hasClear?: boolean
  onChange?: (value: string) => void
  onClear?: () => void
}

export interface IMultiSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  defaultValue?: string[]
  hasClear?: boolean
  onChange?: (
    evt: React.ChangeEvent<HTMLSelectElement> | undefined,
    newValue: string[],
  ) => void
}

export interface IClearButtonProps {
  className?: string
  onClick: React.MouseEventHandler
}

export interface IDateInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
}

export interface IFormattedNumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onlyNumber?: boolean
  value?: number | string
}
