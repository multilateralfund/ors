import { useMemo } from 'react'
import { useSearch } from 'wouter'

export default function useSearchParams() {
  const search = useSearch()
  const searchParams = useMemo(() => new URLSearchParams(search), [search])
  return searchParams
}
