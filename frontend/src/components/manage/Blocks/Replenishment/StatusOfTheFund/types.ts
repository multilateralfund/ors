import { ChangeEvent, Dispatch, ReactNode, SetStateAction } from 'react'

import { IALLOCATIONS, IFormData } from '../Dashboard/useGetDashboardDataTypes'
import { IFieldProps } from '../Inputs'

export type InputOptionsType = Array<{
  id?: string
  label: string
  value: string
}>

export interface IEditIncomeDialogProps extends React.PropsWithChildren {
  agencyOptions: InputOptionsType
  allocations: IALLOCATIONS
  invalidateDataFn: any
  meetingOptions: InputOptionsType
  onCancel: () => void
  yearOptions: InputOptionsType
}

export interface IEditAllocationsProps extends IEditIncomeDialogProps {
  agency: string
}

export interface IEditStaffContractsProps {
  meetingOptions: InputOptionsType
  onCancel: () => void
  yearOptions: InputOptionsType
}

export interface IInputWrapper extends IFieldProps {
  children: ReactNode
}

export interface IInputProps {
  field: string
  label: string
  setFormData: Dispatch<SetStateAction<any>>
}

export interface INumberInputProps extends IInputProps {
  [key: string]: any
}

export interface ISelectInputProps extends IInputProps {
  options: InputOptionsType
  placeholder: string
  value?: string
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
