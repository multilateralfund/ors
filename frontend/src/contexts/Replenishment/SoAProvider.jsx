import { useEffect, useMemo, useState } from 'react'

import { formatApiUrl } from '@ors/helpers/Api/utils'

import SoAContext from './SoAContext'

function useApiReplenishment(startYear) {
  const [contributions, setContributions] = useState([])
  const [replenishmentAmount, setReplenishmentAmount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(
    function () {
      const path = [
        '/api/replenishment/scales-of-assessment',
        new URLSearchParams({ start_year: startYear }),
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
    [startYear],
  )

  return { contributions, replenishmentAmount }
}

function SoAProvider(props) {
  const { children, startYear } = props

  const { contributions, replenishmentAmount } = useApiReplenishment(startYear)

  const version = {
    id: 0,
    get isDraft() {
      return this.status === 'draft'
    },
    get isFinal() {
      return this.status === 'final'
    },
    status: 'draft',
  }

  if (startYear < 2024) {
    version.id = 1
    version.status = 'final'
    version.meeting = 93
    version.decision = 41
  }

  return (
    <SoAContext.Provider
      value={{
        contributions,
        replenishmentAmount,
        version,
      }}
    >
      {children}
    </SoAContext.Provider>
  )
}

export default SoAProvider
