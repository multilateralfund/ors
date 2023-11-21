import type { Api } from '@ors/helpers/Api/Api'
import { DataType, ErrorType } from '@ors/types/primitives'

import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { produce } from 'immer'
import { isFunction } from 'lodash'

import { fetcher } from '@ors/helpers/Api/Api'

export type ApiSettings = Api & {
  onError?: any
  onPending?: any
  onSuccess?: any
  onSuccessNoCatch?: any
}

export default function useApi(props: ApiSettings): {
  apiSettings: ApiSettings
  data: DataType
  error: ErrorType
  loaded: boolean
  loading: boolean
  setApiSettings: Dispatch<SetStateAction<ApiSettings>>
  setParams: (params: { [key: string]: any }) => void
} {
  const [apiSettings, setApiSettings] = useState(props)
  const { options, path, throwError = true } = apiSettings
  const [data, setData] = useState<DataType>(undefined)
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

  function onSuccess(data: DataType) {
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

  function setParams(params: { [key: string]: any }) {
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
    fetcher({
      onError,
      onPending,
      onSuccess,
      options,
      path,
      throwError,
    })
    /* eslint-disable-next-line */
  }, [path, options, throwError])

  return {
    apiSettings,
    data,
    error,
    loaded,
    loading,
    setApiSettings,
    setParams,
  }
}
