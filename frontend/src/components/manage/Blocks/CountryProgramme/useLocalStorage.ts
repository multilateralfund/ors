import type { CPBaseForm, CPEditForm } from './typesCPCreate'
import type { CPReportsSlice } from '@ors/types/store'

import { useCallback, useMemo } from 'react'

import storage from '@ors/storage'

export interface ILSDataEdit {
  form: CPEditForm
  report_id?: number
}

export interface EditLocalStorageType {
  clear: () => void
  load: () => CPEditForm | undefined
  update: (form: CPEditForm) => void
}

export function useEditLocalStorage(
  report: CPReportsSlice['report'],
): EditLocalStorageType {
  const key = useMemo(
    () => `CP_RECOVERY_${report.country?.iso3}_${report.data?.year}_EDIT`,
    [report.country?.iso3, report.data?.year],
  )

  const load = useCallback(() => {
    if (report.data) {
      const data: ILSDataEdit = storage.loadLocalStorage(key)
      if (data?.report_id === report.data.id) {
        return data.form
      } else {
        storage.clearLocalStorage(key)
      }
    }
  }, [key, report.data])

  const update = useCallback(
    (form: CPEditForm) => {
      const data: ILSDataEdit = {
        form: form,
        report_id: report.data?.id,
      }
      storage.updateLocalStorage(key, data)
    },
    [key, report.data?.id],
  )

  const clear = useCallback(() => {
    storage.clearLocalStorage(key)
  }, [key])

  return useMemo(
    () => ({
      clear,
      load,
      update,
    }),
    [clear, load, update],
  )
}

export interface CreateLocalStorageType {
  clear: () => void
  load: () => CPBaseForm
  update: (form: CPBaseForm) => void
}

export function useCreateLocalStorage(): CreateLocalStorageType {
  const key = 'CP_RECOVERY_CREATE'

  const load = useCallback((): CPBaseForm => {
    return storage.loadLocalStorage(key)
  }, [])

  const update = useCallback((form: CPBaseForm) => {
    storage.updateLocalStorage(key, form)
  }, [])

  const clear = useCallback(() => {
    storage.clearLocalStorage(key)
  }, [])

  return {
    clear,
    load,
    update,
  }
}
