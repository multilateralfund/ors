import { PropsWithChildren } from 'react'

export interface IFormDialogProps extends PropsWithChildren {
  className?: string
  onCancel: () => void
  onSubmit: (formData: FormData, evt: React.FormEvent<HTMLFormElement>) => void
  title: string
}
