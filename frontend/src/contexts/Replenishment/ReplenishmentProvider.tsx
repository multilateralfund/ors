import {
  ApiAsOfDate,
  ApiBudgetYears,
  ApiReplenishment,
  ApiReplenishments,
} from '@ors/types/api_replenishment_replenishments'
import { Country } from '@ors/types/store'

import React, {
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { makePeriodOptions } from '@ors/components/manage/Blocks/Replenishment/utils'
import { formatApiUrl } from '@ors/helpers/Api/utils'

import ReplenishmentContext from './ReplenishmentContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'

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
  const { isCPCountryUserType, canEditReplenishment } =
    useContext(PermissionsContext)

  const { children } = props

  const [periods, setPeriods] = useState<ApiReplenishment[]>([])
  const [asOfDate, setAsOfDate] = useState<ApiAsOfDate>({
    as_of_date: '27 May 2024',
  })
  const [budgetYears, setBudgetYears] = useState<ApiBudgetYears>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [countriesSOA, setCountriesSOA] = useState<Country[]>([])
  const [fetchTrigger, setFetchTrigger] = useState(false)

  const refetchData = useCallback(() => {
    setFetchTrigger((prev) => !prev)
  }, [])

  useEffect(
    function () {
      const params = new URLSearchParams({
        values_exclusive_for: 'replenishment',
      })

      Promise.all([
        fetch(formatApiUrl('/api/replenishment/replenishments?final=true'), {
          credentials: 'include',
        }),
        fetch(`${formatApiUrl('/api/countries')}?${params.toString()}`, {
          credentials: 'include',
        }),
        fetch(formatApiUrl('/api/replenishment/countries-soa'), {
          credentials: 'include',
        }),
        fetch(formatApiUrl('/api/replenishment/as-of-date'), {
          credentials: 'include',
        }),
        fetch(formatApiUrl('/api/replenishment/budget-years'), {
          credentials: 'include',
        }),
      ])
        .then(function (responses) {
          const [
            respPeriods,
            respCountries,
            respCountriesSOA,
            respAsOfDate,
            respBudgetYears,
          ] = responses
          return Promise.all([
            respPeriods.json(),
            respCountries.json(),
            respCountriesSOA.json(),
            respAsOfDate.json(),
            respBudgetYears.json(),
          ])
        })
        .then(function (
          jsonData: [
            ApiReplenishments,
            Country[],
            Country[],
            ApiAsOfDate,
            ApiBudgetYears,
          ],
        ) {
          const [
            jsonPeriods,
            jsonCountries,
            jsonCountriesSOA,
            jsonAsOfDate,
            jsonBudgetYears,
          ] = jsonData
          setPeriods(jsonPeriods)
          setCountries(filterCountries(jsonCountries))
          setCountriesSOA(filterCountries(jsonCountriesSOA))
          setAsOfDate(jsonAsOfDate)
          setBudgetYears(jsonBudgetYears)
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
        asOfDate,
        budgetYears,
        countries,
        countriesSOA,
        isCountryUser: isCPCountryUserType,
        isTreasurer: canEditReplenishment,
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
