import { useEffect, useMemo, useState } from 'react'

import { makePeriodOptions } from '@ors/components/manage/Blocks/Replenishment/utils'
import { formatApiUrl } from '@ors/helpers/Api/utils'
import { useStore } from '@ors/store'

import ReplenishmentContext from './ReplenishmentContext'

function filterCountries(countries) {
  const result = []
  for (let i = 0; i < countries.length; i++) {
    if (countries[i].iso3) {
      result.push(countries[i])
    }
  }
  return result
}

function ReplenishmentProvider(props) {
  const { children } = props
  const user = useStore((state) => state.user)
  const isTreasurer = user.data.user_type === 'treasurer'
  const isCountryUser = user.data.user_type === 'country_user'

  const [periods, setPeriods] = useState([])
  const [countries, setCountries] = useState([])

  useEffect(function () {
    Promise.all([
      fetch(formatApiUrl('/api/replenishment/replenishments'), {
        credentials: 'include',
      }),
      fetch(formatApiUrl('/api/replenishment/countries'), {
        credentials: 'include',
      }),
    ])
      .then(function (responses) {
        const [respPeriods, respCountries] = responses
        return Promise.all([respPeriods.json(), respCountries.json()])
      })
      .then(function (jsonData) {
        const [jsonPeriods, jsonCountries] = jsonData
        setPeriods(jsonPeriods)
        setCountries(filterCountries(jsonCountries))
      })
  }, [])

  const periodOptions = useMemo(
    function () {
      return makePeriodOptions(periods)
    },
    [periods],
  )

  return (
    <ReplenishmentContext.Provider
      value={{
        countries,
        isCountryUser,
        isTreasurer,
        periodOptions,
        periods,
      }}
    >
      {children}
    </ReplenishmentContext.Provider>
  )
}

export default ReplenishmentProvider
