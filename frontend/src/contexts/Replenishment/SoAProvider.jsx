import { useEffect, useMemo, useState } from 'react'

import { formatApiUrl } from '@ors/helpers/Api/utils'

import SoAContext from './SoAContext'

function useApiReplenishment(startYear, versionId) {
  const [contributions, setContributions] = useState([])
  const [replenishmentAmount, setReplenishmentAmount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(
    function () {
      const urlParams = {
        start_year: startYear,
      }

      if (versionId !== null && versionId !== undefined) {
        urlParams.version_id = versionId
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
            setReplenishmentAmount(jsonData[0].replenishment.amount)
          }
        })
    },
    [startYear, versionId],
  )

  return { contributions, replenishmentAmount }
}

function makeVersion(id, status, meeting, decision) {
  return {
    id: id,
    decision: decision,
    get isDraft() {
      return this.status === 'draft'
    },
    get isFinal() {
      return this.status === 'final'
    },
    meeting: meeting,
    status: status,
  }
}

function SoAProvider(props) {
  const { children, startYear } = props

  const [currentVersion, setCurrentVersion] = useState(null)
  const { contributions, replenishmentAmount } = useApiReplenishment(
    startYear,
    currentVersion,
  )

  // Mock versions
  const versions = useMemo(
    function () {
      if (startYear < 2024) {
        return [
          makeVersion(3, 'final', 93, 41),
          makeVersion(2, 'final', 81, 32),
          makeVersion(1, 'final', 80, 55),
        ]
      } else {
        return [makeVersion(0, 'draft')]
      }
    },
    [startYear],
  )

  useEffect(
    function () {
      if (versions.length) {
        setCurrentVersion(versions[0].id)
      } else {
        setCurrentVersion(null)
      }
    },
    [versions],
  )

  const version = useMemo(
    function () {
      let r = null

      if (currentVersion !== null) {
        for (let i = 0; i < versions.length; i++) {
          if (versions[i].id === currentVersion) {
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
        replenishmentAmount,
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
