import { ApiEditBPActivity } from '@ors/types/api_bp_get'

import { useCallback, useMemo } from 'react'

import storage from '@ors/storage'

import { EditBPLocalStorageType, ILSBPDataEdit } from './types'

export function useEditLocalStorage(data: {
  activities: Array<ApiEditBPActivity>
  business_plan: any
}): EditBPLocalStorageType {
  const { activities, business_plan } = data || {}

  const key = useMemo(
    () =>
      `BP_RECOVERY_${business_plan?.agency.name}_${business_plan?.year_start}-${business_plan?.year_end}_EDIT`,
    [business_plan],
  )

  const load = useCallback(() => {
    if (activities) {
      const data: ILSBPDataEdit = storage.loadLocalStorage(key)

      if (data?.bp_id === business_plan.id) {
        return data.form
      } else {
        storage.clearLocalStorage(key)
      }
    }
  }, [key, activities, business_plan])

  const update = useCallback(
    (form: Array<ApiEditBPActivity> | undefined) => {
      const data: ILSBPDataEdit = {
        bp_id: business_plan?.id,
        form: form,
      }
      storage.updateLocalStorage(key, data)
    },
    [key, business_plan?.id],
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
