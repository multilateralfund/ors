import { useEffect, useMemo, useState } from 'react'

import { formatApiUrl } from '@ors/helpers/Api/utils'

import SoAContext from './SoAContext'

function useApiReplenishment(startYear, versionId) {
  const [contributions, setContributions] = useState([])
  const [replenishment, setReplenishment] = useState({ amount: 0 })

  useEffect(
    function () {
      const urlParams = {
        start_year: startYear,
      }

      if (versionId !== null && versionId !== undefined) {
        urlParams.version = versionId
      }

      const path = [
        '/api/replenishment/scales-of-assessment',
        new URLSearchParams(urlParams),
      ].join('?')

      fetch(formatApiUrl(path), {
        credentials: 'include',
      })
        .then(function (resp) {
          return resp.json()
        })
        .then(function (jsonData) {
          setContributions(jsonData)
          if (jsonData.length > 0) {
            setReplenishment(jsonData[0].replenishment)
          }
        })
    },
    [startYear, versionId],
  )

  return { contributions, replenishment }
}

function SoAProvider(props) {
  const { children, startYear } = props

  const [currentVersion, setCurrentVersion] = useState(null)
  const { contributions, replenishment } = useApiReplenishment(
    startYear,
    currentVersion,
  )

  // Mock versions
  const versions = useMemo(
    function () {
      return replenishment.scales_of_assessment_versions || []
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
