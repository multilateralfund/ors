import type {
  CreateSliceProps,
  ProjectFieldHistorySlice,
} from '@ors/types/store'
import { defaultSliceData, fetchSliceData } from '@ors/helpers/Store/Store'

import { filter } from 'lodash'
import { produce } from 'immer'

export const createProjectFieldHistorySlice = (
  props: CreateSliceProps,
): ProjectFieldHistorySlice => {
  const { get, set } = props

  const fetchFieldHistory = async (projectId: number) => {
    const options = {
      removeCacheTimeout: 60,
      withStoreCache: true,
    }
    return await fetchSliceData({
      apiSettings: {
        options,
        path: `api/projects/v2/${projectId}/field_history/`,
      },
      slice: 'projectFieldHistory.fieldHistory',
    })
  }

  return {
    fieldHistory: defaultSliceData,
    fetchFieldHistory,
  }
}
