import { useEffect, useState } from 'react'

function useGetSCData(start_year, end_year) {
  const [data, setData] = useState({
    disputed_contributions: null,
    status_of_contributions: null,
    total: null,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (start_year) params.append('start_year', start_year)
    if (end_year) params.append('end_year', end_year)
    const url = `/api/replenishment/status-of-contributions?${params.toString()}`

    fetch(url, {
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => {
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

  return [data, loading]
}

export default useGetSCData
