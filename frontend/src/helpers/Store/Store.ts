import type { DataType, ErrorType, SliceData } from '@ors/types/primitives'

import { produce } from 'immer'
import { PropertyPath, get, set } from 'lodash'

import { store } from '@ors/_store'

import api from '../Api/_api'
import { IApi } from '../Api/types'

export const defaultSliceData: SliceData = {
  data: null,
  error: null,
  loaded: false,
  loading: false,
}

export function getSlice<T>(path: PropertyPath): T {
  return get(store.current.getState(), path)
}

export function setSlice(
  path: PropertyPath,
  value: { [key: string]: any },
): void {
  store.current.setState(
    produce((state) => set(state, path, { ...getSlice(path), ...value })),
  )
}

export function getInitialSliceData<D = DataType, E = ErrorType>(
  data?: D,
): SliceData<D, E> {
  return {
    ...defaultSliceData,
    data: data || null,
    error: null,
    loaded: !!data,
    loading: false,
  } as SliceData<D, E>
}

export async function fetchSliceData(props: {
  apiSettings: Partial<IApi>
  parseResponse?: (response: any) => any
  slice: PropertyPath
}) {
  const { apiSettings, parseResponse, slice } = props
  if (!apiSettings.path) {
    throw Error('fetchSliceData: Path should not be empty')
  }
  setSlice(slice, { loaded: false, loading: true })
  try {
    const response = await api(
      apiSettings.path,
      apiSettings.options,
      apiSettings.throwError,
    )
    const data = parseResponse?.(response) || response
    setSlice(slice, {
      data,
      error: null,
      loaded: true,
      loading: false,
    })
    return data
  } catch (err) {
    let error
    try {
      error = {
        _info: err,
        ...(await err.json()),
      }
    } catch {
      error = err
    }
    setSlice(slice, {
      data: null,
      error,
      loaded: false,
      loading: false,
    })
    return null
  }
}
