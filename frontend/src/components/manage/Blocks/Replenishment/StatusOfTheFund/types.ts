import { ChangeEvent, Dispatch, ReactNode, SetStateAction } from 'react'

import { IALLOCATIONS } from '../Dashboard/useGetDashboardDataTypes'
import { IFieldProps } from '../Inputs'

export type InputOptionType = {
  id?: string
  label: string
  value: string
  year?: string
}

export type InputOptionsType = Array<InputOptionType>

export interface IEditIncomeDialogProps
  extends IEditMiscellaneousIncomeDialogProps {
  agencyOptions: InputOptionsType
  allocations: IALLOCATIONS
}

export interface IEditMiscellaneousIncomeDialogProps {
  handleSubmitEditDialog: (formData: any, field: string) => void
  meetingOptions: InputOptionsType
  onCancel: () => void
  yearOptions: InputOptionsType
}

export interface IUploadFilesProps {
  handleUploadFiles: (formData: any) => void
  meetingOptions: InputOptionsType
  onCancel: () => void
  yearOptions: InputOptionsType
}

export interface IEditAllocationsProps extends IEditIncomeDialogProps {
  agency: string
}

export interface IEditSecretariatProps {
  field: string
  handleSubmitEditDialog: (formData: any, field: string) => void
  label: string
  meetingOptions: InputOptionsType
  onCancel: () => void
  title: string
}

export interface IInputWrapper extends IFieldProps {
  children: ReactNode
}

export interface IInputProps {
  field: string
  label: string
  setFormData?: Dispatch<SetStateAction<any>>
}

export interface INumberInputProps extends IInputProps {
  [key: string]: any
}

export interface ISelectInputProps extends IInputProps {
  clearBtnClassName?: string
  options: InputOptionsType
  placeholder?: string
  value?: string
}

export interface ISimpleInputProps extends IInputProps {
  required?: boolean
  type?: string
}

export interface IPopoverInputProps {
  className?: string
  clearBtnClassName?: string
  field?: string
  id?: string
  onChange?: (value: string) => void
  onClear?: () => void
  options: InputOptionsType
  placeholder?: string
  required?: boolean
  value?: string
  withClear?: boolean
  withInputPlaceholder?: boolean
  label?: string
  disabled?: boolean
}

export interface IPopoverContentProps extends IPopoverInputProps {
  closePopover: () => void
  setSelectedEntry: Dispatch<SetStateAction<string>>
}

export interface IHandleClearInputChange {
  (setFormData: Dispatch<SetStateAction<any>>, name: string): void
}

export interface IHandleInputChange {
  (
    evt: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    setFormData: Dispatch<SetStateAction<any>>,
    name: string,
  ): void
}

export interface IHandleSelectChange {
  (
    value: string,
    setFormData: Dispatch<SetStateAction<any>>,
    name: string,
  ): void
}
