import { PropsWithChildren, useCallback, useState } from 'react'
import ConfirmDialog, { ConfirmOptions } from '@ors/contexts/ConfirmDialog.tsx'
import { ConfirmationContext } from '@ors/contexts/ConfirmationContext.tsx'

interface ConfirmationProviderProps extends PropsWithChildren {}

interface DialogState {
  open: boolean
  options: ConfirmOptions
  resolve?: (value: boolean) => void
}

export default function ConfirmationProvider({
  children,
}: ConfirmationProviderProps) {
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    options: {
      title: '',
      message: '',
    },
  })

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        open: true,
        options,
        resolve,
      })
    })
  }, [])

  const handleClose = (result: boolean) => {
    dialog.resolve?.(result)
    setDialog((prev) => ({ ...prev, open: false }))
  }

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        open={dialog.open}
        onConfirm={() => handleClose(true)}
        onCancel={() => handleClose(false)}
        {...dialog.options}
      />
    </ConfirmationContext.Provider>
  )
}
