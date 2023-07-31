import type { Api } from '@ors/helpers/Api/Api'
import type { DataType, ErrorType } from '@ors/types/primitives'

import { useEffect, useState } from 'react'

import { fetcher } from '@ors/helpers/Api/Api'

export default function useApi(props: Api): [any, any, boolean, boolean] {
  const { options, path, throwError = true } = props
  const [data, setData] = useState<DataType>(undefined)
  const [error, setError] = useState<ErrorType>(undefined)
  const [loading, setLoading] = useState<boolean>(false)
  const [loaded, setLoaded] = useState<boolean>(false)

  function onPending() {
    setLoading(true)
    setLoaded(false)
  }

  function onSuccess(data: DataType) {
    setData(data)
    setError(null)
    setLoading(false)
    setLoaded(true)
  }

  function onError(error: DataType) {
    setData(null)
    setError(error)
    setLoading(false)
    setLoaded(true)
  }

  function onSuccessNoCatch(data: DataType) {
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
  }, [path, options, throwError])

  return [data, error, loading, loaded]
}
