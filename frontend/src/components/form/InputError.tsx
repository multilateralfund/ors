import { PropsWithChildren, ReactNode } from 'react'

export const InputError = ({ children }: PropsWithChildren) => {
  return (
    <p className="mt-2 text-sm text-red-600 dark:text-red-500">
      <span className="font-medium">{children}</span>
    </p>
  )
}
