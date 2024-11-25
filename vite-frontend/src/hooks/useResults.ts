import { DataType } from '@ors/types/primitives'

import { useEffect, useState } from 'react'

import { isArray, isPlainObject } from 'lodash'

export default function useResults(params: {
  data: DataType
  loaded: boolean
  loading: boolean
}) {
  const { data } = params
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(0)
  const [results, setResults] = useState<Array<any>>([])

  useEffect(() => {
    if (isArray(data)) {
      setCount(data.length)
      setResults(data)
    } else if (isPlainObject(data) && isArray(data.results)) {
      setCount(data.count || 0)
      setResults(data.results || [])
    }
  }, [data])

  useEffect(() => {
    setLoaded(params.loaded)
  }, [params.loaded])

  useEffect(() => {
    setLoading(params.loading)
  }, [params.loading])

  return {
    count,
    loaded,
    loading,
    results,
  }
}
