import { PropsWithChildren } from 'react'

export interface FormDialogProps extends PropsWithChildren {
  className?: string
  onCancel: () => void
  onSubmit: (formData: FormData, evt: React.FormEvent<HTMLFormElement>) => void
  title: string
}

export interface ConfirmDialogProps extends PropsWithChildren {
  className?: string
  onCancel: () => void
  onSubmit: () => void
  title?: string
}
export interface PeriodSelectorOption {
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
}
