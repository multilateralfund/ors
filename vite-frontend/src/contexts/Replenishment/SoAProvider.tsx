import { ApiReplenishment } from '@ors/types/api_replenishment_replenishments'
import { ApiReplenishmentSoA } from '@ors/types/api_replenishment_scales_of_assessment'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { api } from '@ors/helpers'

import SoAContext from './SoAContext'
import { ISoAProvider } from './types'

function useApiReplenishment(startYear: string, versionId: null | number) {
  const [contributions, setContributions] = useState<ApiReplenishmentSoA>([])
  const [replenishment, setReplenishment] = useState<ApiReplenishment>()
  const [fetchTrigger, setFetchTrigger] = useState(false)

  const refetchData = useCallback(() => {
    setFetchTrigger((prev) => !prev)
  }, [])

  useEffect(
    function () {
      // TODO: refactor to swr/react-query
      // Bare fetches have race conditions, no caching, no deduplication
      // Server data should live in a cache, not in a global context
      // I think this data is better fetched after the replenishment so we don't
      // make 2 requests (one with and one without a version)
      // See: https://swr.vercel.app/docs/conditional-fetching#dependent
      let ignore = false

      api<ApiReplenishmentSoA>('/api/replenishment/scales-of-assessment', {
        params: {
          start_year: startYear,
          version: versionId,
        },
      }).then(function (jsonData) {
        if (!ignore && jsonData) {
          setContributions(jsonData)
          if (jsonData.length > 0) {
            setReplenishment(jsonData[0].replenishment)
          }
        }
      })

      return function () {
        ignore = true
      }
    },
    [startYear, versionId, fetchTrigger],
  )

  return { contributions, refetchData, replenishment }
}

function SoAProvider(props: ISoAProvider) {
  const { children, startYear } = props

  const [currentVersion, setCurrentVersion] = useState<null | number>(null)
  const { contributions, refetchData, replenishment } = useApiReplenishment(
    startYear,
    currentVersion,
  )

  const versions = useMemo(
    function () {
      return replenishment
        ? replenishment.scales_of_assessment_versions || []
        : []
    },
    [replenishment],
  )

  useEffect(
    function () {
      if (versions.length > 0 && currentVersion === null) {
        setCurrentVersion(versions[0].version)
      }
    },
    [currentVersion, versions],
  )

  const version = useMemo(
    function () {
      let r = null

      if (currentVersion !== null) {
        for (let i = 0; i < versions.length; i++) {
          if (versions[i].version === currentVersion) {
            r = versions[i]
            break
          }
        }
      }

      return r
    },
    [versions, currentVersion],
  )

  return (
    <SoAContext.Provider
      value={{
        contributions,
        refetchData,
        replenishment,
        setCurrentVersion,
        version,
        versions,
      }}
    >
      {children}
    </SoAContext.Provider>
  )
}

export default SoAProvider
