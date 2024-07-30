import { useEffect, useMemo, useState } from 'react'

import { transformData } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import { formatApiUrl } from '@ors/helpers'

const BASE_URL = '/api/replenishment/status-of-contributions'

function useGetSCData(start_year, end_year) {
  const [data, setData] = useState({
    disputed_contributions: null,
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
          disputed_contributions: data.disputed_contributions,
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
        {
          agreed_contributions: data.disputed_contributions,
          country: 'Disputed Contributions ***',
          outstanding_contributions: data.disputed_contributions,
        },
        {
          agreed_contributions: data.disputed_contributions,
          can_delete: true,
          country: (
            <li className="flex flex-col gap-1">
              <span>Romania</span>
              <span>Some Comment</span>
            </li>
          ),
          country_to_display: 'Romania',
          outstanding_contributions: data.disputed_contributions,
        },
        {
          agreed_contributions: data.total?.agreed_contributions_with_disputed,
          country: 'Total',
          outstanding_contributions:
            data.total?.outstanding_contributions_with_disputed,
        },
      ]
    },
    [data],
  )

  return { data, extraRows, loading, refetchSCData, rows }
}

export default useGetSCData
