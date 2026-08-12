import type { IApi } from '@ors/helpers/Api/types'
import { DataType, ErrorType } from '@ors/types/primitives'

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useId,
  useState,
} from 'react'

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
  reactivePath?: boolean
} & IApi

export interface UseApiReturn<DT, PT = Record<string, any>> {
  apiSettings: ApiSettings
  data: DT | null | undefined
  error: ErrorType
  loaded: boolean
  loading: boolean
  params: Record<string, any>
  setApiSettings: Dispatch<SetStateAction<ApiSettings>>
  setParams: (params: PT) => void
  refetch: () => void
}

export default function useApi<DT = DataType, PT = Record<string, any>>(
  props: ApiSettings,
): UseApiReturn<DT, PT> {
  const id = useId()
  const [fetchIndex, setFetchIndex] = useState(0)
  const [apiSettings, setApiSettings] = useState(props)
  const { options, path, throwError = true, reactivePath = false } = apiSettings
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

  const setParams = useCallback(
    (params: PT) => {
      setApiSettings(
        produce((apiSettings) => {
          apiSettings.options.params = {
            ...apiSettings.options.params,
            ...params,
          }
        }),
      )
    },
    [setApiSettings],
  )

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
  }, [path, options, throwError, fetchIndex])

  const refetch = useCallback(() => {
    setFetchIndex((index) => index + 1)
  }, [])

  useEffect(() => {
    if (!reactivePath) {
      return
    }

    const triggerIf = props.options?.triggerIf
    const shouldUpdate =
      apiSettings.path !== props.path ||
      apiSettings.options?.triggerIf !== triggerIf

    if (shouldUpdate) {
      setApiSettings((prev) => ({
        ...prev,
        options: {
          ...prev.options,
          ...props.options,
          params: prev.options?.params ?? props.options?.params,
        },
        path: props.path,
      }))
      refetch()
    }

    // Yes, props.path, as the "path" in the code comes from state so it's not reactive
    // unless manually set
  }, [
    apiSettings.options?.triggerIf,
    apiSettings.path,
    props.options,
    props.options?.triggerIf,
    props.path,
    reactivePath,
    refetch,
  ])

  return {
    apiSettings,
    data,
    error,
    loaded,
    loading,
    params: options?.params || {},
    setApiSettings,
    setParams,
    refetch,
  }
}
