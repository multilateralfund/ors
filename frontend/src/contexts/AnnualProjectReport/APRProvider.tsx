import { APRContext } from '@ors/contexts/AnnualProjectReport/APRContext.tsx'
import { PropsWithChildren, useCallback, useState } from 'react'
import ConfirmDialog, {
  ConfirmOptions,
} from '@ors/contexts/AnnualProjectReport/ConfirmDialog.tsx'

interface ProjectsDataProviderProps extends PropsWithChildren {}

interface DialogState {
  open: boolean
  options: ConfirmOptions
  resolve?: (value: boolean) => void
}

export default function APRProvider({ children }: ProjectsDataProviderProps) {
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
    <APRContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        open={dialog.open}
        onConfirm={() => handleClose(true)}
        onCancel={() => handleClose(false)}
        {...dialog.options}
      />
    </APRContext.Provider>
  )
}
