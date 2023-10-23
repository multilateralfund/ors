import type { Api } from '@ors/helpers/Api/Api'
import { DataType, ErrorType } from '@ors/types/primitives'

import { useEffect, useState } from 'react'

import { isFunction } from 'lodash'

import { fetcher } from '@ors/helpers/Api'

export default function useApi(
  props: Api & {
    onError?: any
    onPending?: any
    onSuccess?: any
    onSuccessNoCatch?: any
  },
): {
  data: DataType
  error: ErrorType
  loaded: boolean
  loading: boolean
} {
  const { options, path, throwError = true } = props
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

  function onSuccessNoCatch(data: DataType) {
    if (isFunction(props.onSuccessNoCatch)) {
      props.onSuccessNoCatch(error)
    }
    setData(data)
    setError(undefined)
    setLoading(false)
    setLoaded(!!data)
  }

  useEffect(() => {
    fetcher({
      onError,
      onPending,
      onSuccess,
      onSuccessNoCatch,
      options,
      path,
      throwError,
    })
    /* eslint-disable-next-line */
  }, [path, options, throwError])

  return { data, error, loaded, loading }
}
