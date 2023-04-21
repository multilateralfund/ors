import React, { PropsWithChildren } from 'react'

type Props = {
  children?: React.ReactNode
}

export const InputError = ({ children }: PropsWithChildren) => {
  return (
    <p className="mt-2 text-sm text-red-600 dark:text-red-500">
      <span className="font-medium">{children}</span>
    </p>
  )
}
