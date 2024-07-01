import { useEffect, useMemo, useState } from 'react'

import { transformData } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import { formatApiUrl } from '@ors/helpers'

function useGetSCData(start_year, end_year) {
  const [data, setData] = useState({
    disputed_contributions: null,
    status_of_contributions: null,
    total: null,
  })
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (start_year) params.append('start_year', start_year)
    if (end_year) params.append('end_year', end_year)
    const url = `/api/replenishment/status-of-contributions?${params.toString()}`

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
  }, [start_year, end_year])

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
        },
        {
          agreed_contributions: data.total?.agreed_contributions_with_disputed,
          country: 'Total',
        },
      ]
    },
    [data],
  )

  return {data, extraRows, loading, rows}
}

export default useGetSCData
