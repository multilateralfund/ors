import { ApiEditBPActivity } from '@ors/types/api_bp_get'

import { useCallback, useMemo } from 'react'

import { upperCase } from 'lodash'

import storage from '@ors/storage'

export function useEditLocalStorageConsolidated(
  activities: Array<ApiEditBPActivity>,
  type: string,
  period: string,
) {
  const [year_start, year_end] = period.split('-')

  const key = useMemo(
    () => `BP_RECOVERY_${upperCase(type)}_${year_start}-${year_end}_EDIT`,
    [type, year_end, year_start],
  )

  const load = useCallback(() => {
    if (activities && activities.length > 0) {
      const data = storage.loadLocalStorage(key)

      if (data) {
        return data.form
      } else {
        storage.clearLocalStorage(key)
      }
    }
  }, [key, activities])

  const update = useCallback(
    (form: Array<ApiEditBPActivity> | undefined) => {
      const data = {
        form: form,
      }
      storage.updateLocalStorage(key, data)
    },
    [key],
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
    [load, clear, update],
  )
}
