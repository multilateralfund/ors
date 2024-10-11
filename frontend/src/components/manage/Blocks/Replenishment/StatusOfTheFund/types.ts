import { ChangeEvent, Dispatch, ReactNode, SetStateAction } from 'react'

import { IALLOCATIONS, IFormData } from '../Dashboard/useGetDashboardDataTypes'
import { IFieldProps } from '../Inputs'

export type InputOptionsType = Array<{ label: string; value: string }>

export interface IEditIncomeDialogProps extends React.PropsWithChildren {
  agencyOptions: InputOptionsType
  allocations: IALLOCATIONS
  data: IFormData
  onCancel: () => void
  yearOptions: InputOptionsType
}

export interface IEditAllocationsProps extends IEditIncomeDialogProps {
  agency: string
}

export interface IInputWrapper extends IFieldProps {
  children: ReactNode
}

export interface IInputProps {
  field: string
  label: string
  setFormState: Dispatch<SetStateAction<any>>
}

export interface INumberInputProps extends IInputProps {
  [key: string]: any
}

export interface ISelectInputProps extends IInputProps {
  options: InputOptionsType
  placeholder: string
  value?: string
}

export interface IHandleInputChange {
  (
    evt: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    setFormState: Dispatch<SetStateAction<any>>,
    name: string,
  ): void
}
