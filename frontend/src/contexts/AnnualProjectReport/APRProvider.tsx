import { APRContext } from '@ors/contexts/AnnualProjectReport/APRContext.tsx'
import { PropsWithChildren, useCallback, useContext, useState } from 'react'
import ConfirmDialog, {
  ConfirmOptions,
} from '@ors/contexts/ConfirmDialog.tsx'
import useApi from '@ors/hooks/useApi.ts'
import { AnnualProgressReportCurrentYear } from '@ors/app/annual-project-report/types.ts'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'

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
  const { canViewAPR } = useContext(PermissionsContext)
  const aprCurrentYear = useApi<AnnualProgressReportCurrentYear>({
    options: {
      withStoreCache: false,
      triggerIf: canViewAPR,
    },
    path: `api/annual-project-report/current-year/`,
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
    <APRContext.Provider value={{ confirm, aprCurrentYear }}>
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
