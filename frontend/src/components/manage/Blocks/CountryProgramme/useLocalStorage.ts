import type { CPBaseForm } from './typesCPCreate'
import type { CPReportsSlice } from '@ors/types/store'

import { useCallback, useMemo } from 'react'

import storage from '@ors/storage'

export interface ILSDataEdit {
  form: CPBaseForm
  report_id?: number
}

export function useEditLocalStorage(report: CPReportsSlice['report']) {
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
    (form: CPBaseForm) => {
      const data: ILSDataEdit = {
        form: form,
        report_id: report.data?.id,
      }
      storage.updateLocalStorage(key, data)
    },
    [key, report.data?.id],
  )

  return useMemo(
    () => ({
      load,
      update,
    }),
    [load, update],
  )
}

export function useCreateLocalStorage() {
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
