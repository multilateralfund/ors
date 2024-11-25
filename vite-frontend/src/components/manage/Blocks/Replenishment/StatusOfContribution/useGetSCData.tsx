import { ApiReplenishmentSoC } from '@ors/types/api_replenishment_status_of_contributions'

import { useContext, useEffect, useMemo, useState } from 'react'

import { transformData } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { formatApiUrl } from '@ors/helpers'

import { SoCExtraRow, SoCRow } from './types'

const BASE_URL = '/api/replenishment/status-of-contributions'

type Nullable<T> = { [K in keyof T]: T[K] | null }

function useGetSCData(start_year?: string, end_year?: string) {
  const ctx = useContext(ReplenishmentContext)
  const [data, setData] = useState<Nullable<ApiReplenishmentSoC>>({
    ceit: null,
    ceit_countries: null,
    disputed_contributions: null,
    disputed_contributions_per_country: null,
    percentage_total_paid_current_year: null,
    status_of_contributions: null,
    total: null,
  })
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<SoCRow[]>([])
  const [refetchTrigger, setRefetchTrigger] = useState(false)

  const refetchSCData = () => {
    setRefetchTrigger((prev) => !prev)
  }

  useEffect(() => {
    setLoading(true)

    let url

    if (start_year && end_year) {
      url = `${BASE_URL}/${start_year}/${end_year}/`
    } else if (start_year) {
      url = `${BASE_URL}/${start_year}`
    } else {
      url = `${BASE_URL}/summary`
    }

    fetch(formatApiUrl(url), {
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((respData: ApiReplenishmentSoC) => {
        setRows(transformData(respData.status_of_contributions))

        setData({
          ceit: respData.ceit,
          ceit_countries: respData.ceit_countries,
          disputed_contributions: respData.disputed_contributions,
          disputed_contributions_per_country:
            respData.disputed_contributions_per_country,
          percentage_total_paid_current_year:
            respData.percentage_total_paid_current_year,
          status_of_contributions: respData.status_of_contributions,
          total: respData.total,
        })
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error:', error)
        setLoading(false)
      })
  }, [start_year, end_year, refetchTrigger])

  const extraRows: SoCExtraRow[] = useMemo(
    function () {
      const disputedPerCountry =
        data?.disputed_contributions_per_country?.map((disputed) => ({
          agreed_contributions: disputed.amount,
          can_delete: ctx.isTreasurer,
          country: (
            <div className="flex flex-col gap-1 !whitespace-normal">
              <span className="inline-block">{disputed.country.name}</span>
              <span className="inline-block !break-words">
                {disputed.comment}
              </span>
            </div>
          ),
          country_to_display: disputed.country.name,
          disputed_id: disputed.id,
          outstanding_contributions: disputed.amount,
        })) || []

      return [
        {
          country: 'Total',
          ...data.total,
        },
        //...disputedPerCountry,
        {
          agreed_contributions: data.disputed_contributions,
          country: 'Disputed Contributions',
          outstanding_contributions: data.disputed_contributions,
        },
        {
          agreed_contributions: data.total?.agreed_contributions_with_disputed,
          country: 'Total',
          outstanding_contributions:
            data.total?.outstanding_contributions_with_disputed,
        },
        {
          agreed_contributions: data.ceit?.agreed_contributions,
          bilateral_assistance: data.ceit?.bilateral_assistance,
          cash_payments: data.ceit?.cash_payments,
          country: 'CEIT',
          gain_loss: data.ceit?.gain_loss,
          outstanding_contributions: data.ceit?.outstanding_contributions,
          promissory_notes: data.ceit?.promissory_notes,
        },
      ]
    },
    [data, ctx.isTreasurer],
  )

  return { data, extraRows, loading, refetchSCData, rows }
}

export default useGetSCData
