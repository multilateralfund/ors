'use client'

import {
  ApiReplenishmentSoA,
  ApiReplenishmentSoAEntry,
} from '@ors/types/api_replenishment_scales_of_assessment'

import { useEffect, useMemo, useState } from 'react'

import { formatApiUrl } from '@ors/helpers/Api/utils'

const BASE_URL = 'api/replenishment/scales-of-assessment/'

let ABORT_CONTROLLER = new AbortController()

function cancelInFlight() {
  ABORT_CONTROLLER.abort()
  ABORT_CONTROLLER = new AbortController()
}

function useGetCountryReplenishmentInfo(country_id: number | string) {
  const [results, setResults] = useState<ApiReplenishmentSoAEntry[]>([])

  useEffect(() => {
    cancelInFlight()
    if (country_id) {
      const params = new URLSearchParams({
        country_id: country_id.toString(),
        is_final: 'true',
      })
      const url = `${formatApiUrl(BASE_URL)}?${params.toString()}`

      fetch(url, {
        credentials: 'include',
        signal: ABORT_CONTROLLER.signal,
      })
        .then((response) => response.json())
        .then((entries: ApiReplenishmentSoA) => {
          if (entries.length > 1) {
            console.warn(
              'useGetCountryReplenishmentInfo',
              'got more than one result!',
              entries,
            )
          }
          if (entries.length > 0) {
            setResults(entries)
          } else {
            setResults([])
          }
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            console.error('Error: ', error)
          }
          setResults([])
        })
    }
  }, [country_id])

  const result = useMemo(
    function () {
      return {
        entries: results,
        getForYear: (year: number) => getEntryForYear(results, year),
      }
    },
    [results],
  )

  return result
}

function getEntryForYear(entries: ApiReplenishmentSoAEntry[], year: number) {
  const result: {
    entry: ApiReplenishmentSoAEntry | null
    matched: boolean
    period: null | string
  } = {
    entry: entries.length > 0 ? entries[entries.length - 1] : null,
    matched: false,
    period: null,
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const { end_year, start_year } = entry.replenishment
    if (year >= start_year && year <= end_year) {
      result.entry = entry
      result.matched = true
      break
    }
  }

  if (result.entry) {
    const { end_year, start_year } = result.entry?.replenishment
    result.period = `${start_year} - ${end_year}`
  }

  return result
}

export default useGetCountryReplenishmentInfo
