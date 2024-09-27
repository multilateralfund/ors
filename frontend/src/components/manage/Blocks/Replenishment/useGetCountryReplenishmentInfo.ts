'use client'

import {
  ApiReplenishmentSoA,
  ApiReplenishmentSoAEntry,
} from '@ors/types/api_replenishment_scales_of_assessment'

import { useEffect, useState } from 'react'

import { formatApiUrl } from '@ors/helpers/Api/utils'

const BASE_URL = 'api/replenishment/scales-of-assessment/'

let ABORT_CONTROLLER = new AbortController()

function cancelInFlight() {
  ABORT_CONTROLLER.abort()
  ABORT_CONTROLLER = new AbortController()
}

function useGetCountryReplenishmentInfo(
  start_year: number | string,
  country_id: number | string,
) {
  const [result, setResult] = useState<ApiReplenishmentSoAEntry | null>(null)

  useEffect(() => {
    cancelInFlight()
    if (start_year && country_id) {
      const params = new URLSearchParams({
        country_id: country_id.toString(),
        is_final: 'true',
        start_year: start_year.toString(),
      })
      const url = `${formatApiUrl(BASE_URL)}?${params.toString()}`

      fetch(url, {
        credentials: 'include',
        signal: ABORT_CONTROLLER.signal,
      })
        .then((response) => response.json())
        .then((results: ApiReplenishmentSoA) => {
          if (results.length > 1) {
            console.warn(
              'useGetCountryReplenishmentInfo',
              'got more than one result!',
              results,
            )
          }
          if (results.length > 0) {
            setResult(results[0])
          } else {
            setResult(null)
          }
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            console.error('Error: ', error)
          }
          setResult(null)
        })
    }
  }, [start_year, country_id])

  return [result]
}

export default useGetCountryReplenishmentInfo
