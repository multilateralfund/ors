import { PropsWithChildren } from 'react'
import { ApiBPYearRange } from '@ors/types/api_bp_get_years.ts'

export interface FormDialogProps extends PropsWithChildren {
  className?: string
  onCancel: () => void
  onSubmit: (formData: FormData, evt: React.FormEvent<HTMLFormElement>) => void
  title: string
}

export interface FormEditDialogProps extends FormDialogProps {
  open?: boolean
  withFooter?: boolean
}

export interface ConfirmDialogProps extends PropsWithChildren {
  className?: string
  onCancel: () => void
  onSubmit: () => void
  title?: string
}
export interface PeriodSelectorOption extends Omit<ApiBPYearRange, 'year_end'> {
  label: string
  value: string
}
export interface PeriodSelectorProps {
  label?: string
  onChange?: (
    newPath: string,
    options: {
      basePath: string
      option: PeriodSelectorOption
    },
  ) => void
  period?: null | string
  periodOptions: PeriodSelectorOption[]
  selectedPeriod?: string
  inputClassName?: string
  menuClassName?: string
  withDisabledOptions?: boolean
}

export interface FileForUpload {
  contentType: string
  data: string
  encoding: string
  filename: string
}
