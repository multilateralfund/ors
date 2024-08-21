import { useContext, useEffect, useMemo, useState } from 'react'

import { transformData } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { formatApiUrl } from '@ors/helpers'

const BASE_URL = '/api/replenishment/status-of-contributions'

function useGetSCData(start_year, end_year) {
  const ctx = useContext(ReplenishmentContext)
  const [data, setData] = useState({
    ceit: null,
    disputed_contributions: null,
    disputed_contributions_per_country: null,
    percentage_total_paid_current_year: null,
    status_of_contributions: null,
    total: null,
  })
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
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
      .then((data) => {
        setRows(transformData(data.status_of_contributions))

        setData({
          ceit: data.ceit,
          disputed_contributions: data.disputed_contributions,
          disputed_contributions_per_country:
            data.disputed_contributions_per_country,
          percentage_total_paid_current_year:
            data.percentage_total_paid_current_year,
          status_of_contributions: data.status_of_contributions,
          total: data.total,
        })
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error:', error)
        setLoading(false)
      })
  }, [start_year, end_year, refetchTrigger])

  const extraRows = useMemo(
    function () {
      return [
        {
          country: 'Total',
          ...data.total,
        },
        ...(data?.disputed_contributions_per_country?.map((disputed) => ({
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
        })) || []),
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
