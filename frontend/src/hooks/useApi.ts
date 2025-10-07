import type { IApi } from '@ors/helpers/Api/types'
import { DataType, ErrorType } from '@ors/types/primitives'

import { Dispatch, SetStateAction, useEffect, useId, useState } from 'react'

import { produce } from 'immer'
import { isFunction } from 'lodash'

import { fetcher } from '@ors/helpers/Api/Api'
import { debounce } from '@ors/helpers/Utils/Utils'

export type ApiSettings = {
  onError?: any
  onPending?: any
  onSuccess?: any
  onSuccessNoCatch?: any
  parseParams?: any
} & IApi

export default function useApi<DT = DataType>(
  props: ApiSettings,
): {
  apiSettings: ApiSettings
  data: DT | null | undefined
  error: ErrorType
  loaded: boolean
  loading: boolean
  params: Record<string, any>
  setApiSettings: Dispatch<SetStateAction<ApiSettings>>
  setParams: (params: Record<string, any>) => void
} {
  const id = useId()
  const [apiSettings, setApiSettings] = useState(props)
  const { options, path, throwError = true } = apiSettings
  const [data, setData] = useState<DT | null | undefined>(undefined)
  const [error, setError] = useState<ErrorType>(undefined)
  const [loading, setLoading] = useState<boolean>(false)
  const [loaded, setLoaded] = useState<boolean>(false)

  function onPending() {
    if (isFunction(props.onPending)) {
      props.onPending()
    }
    setLoading(true)
    setLoaded(false)
  }

  function onSuccess(data: DT) {
    if (isFunction(props.onSuccess)) {
      props.onSuccess(data)
    }
    setData(data)
    setError(null)
    setLoading(false)
    setLoaded(true)
  }

  function onError(error: ErrorType) {
    if (isFunction(props.onError)) {
      props.onError(error)
    }
    setData(null)
    setError(error)
    setLoading(false)
    setLoaded(true)
  }

  function setParams(params: Record<string, any>) {
    setApiSettings(
      produce((apiSettings) => {
        apiSettings.options.params = {
          ...apiSettings.options.params,
          ...params,
        }
      }),
    )
  }

  useEffect(() => {
    debounce(
      () => {
        const params = isFunction(props.parseParams)
          ? props.parseParams(options?.params)
          : options?.params
        fetcher({
          onError,
          onPending,
          onSuccess,
          options: {
            ...(options || {}),
            params,
          },
          path,
          throwError,
        })
      },
      300,
      `useApi:${id}`,
    )
    /* eslint-disable-next-line */
  }, [path, options, throwError])

  return {
    apiSettings,
    data,
    error,
    loaded,
    loading,
    params: options?.params || {},
    setApiSettings,
    setParams,
  }
}
