import {
  ApiReplenishment,
  ApiReplenishments,
} from '@ors/types/api_replenishment_replenishments'
import { Country } from '@ors/types/store'
import { isCountryUserType } from '@ors/types/user_types'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { makePeriodOptions } from '@ors/components/manage/Blocks/Replenishment/utils'
import { formatApiUrl } from '@ors/helpers/Api/utils'
import { useStore } from '@ors/store'

import ReplenishmentContext from './ReplenishmentContext'

function filterCountries(countries: Country[]) {
  const result = []
  for (let i = 0; i < countries.length; i++) {
    if (countries[i].iso3) {
      result.push(countries[i])
    }
  }
  return result
}

function ReplenishmentProvider(props: { children: React.ReactNode }) {
  const { children } = props
  const user = useStore((state) => state.user)
  const isTreasurer = user.data.user_type === 'treasurer'
  const isSecretariat = user.data.user_type === 'secretariat'
  const isCountryUser = isCountryUserType[user.data.user_type]

  const [periods, setPeriods] = useState<ApiReplenishment[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [countriesSOA, setCountriesSOA] = useState<Country[]>([])
  const [fetchTrigger, setFetchTrigger] = useState(false)

  const refetchData = useCallback(() => {
    setFetchTrigger((prev) => !prev)
  }, [])

  useEffect(
    function () {
      Promise.all([
        fetch(formatApiUrl('/api/replenishment/replenishments'), {
          credentials: 'include',
        }),
        fetch(formatApiUrl('/api/replenishment/countries'), {
          credentials: 'include',
        }),
        fetch(formatApiUrl('/api/replenishment/countries-soa'), {
          credentials: 'include',
        }),
      ])
        .then(function (responses) {
          const [respPeriods, respCountries, respCountriesSOA] = responses
          return Promise.all([respPeriods.json(), respCountries.json(), respCountriesSOA.json()])
        })
        .then(function (jsonData: [ApiReplenishments, Country[], Country[]]) {
          const [jsonPeriods, jsonCountries, jsonCountriesSOA] = jsonData
          setPeriods(jsonPeriods)
          setCountries(filterCountries(jsonCountries))
          setCountriesSOA(filterCountries(jsonCountriesSOA))
        })
    },
    [fetchTrigger],
  )

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
        countriesSOA,
        isCountryUser,
        isSecretariat,
        isTreasurer,
        periodOptions,
        periods,
        refetchData,
      }}
    >
      {children}
    </ReplenishmentContext.Provider>
  )
}

export default ReplenishmentProvider
