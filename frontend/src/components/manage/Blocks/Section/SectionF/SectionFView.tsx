/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react'

import { Box } from '@mui/material'
import { useParams } from 'next/navigation'

import { getResults } from '@ors/helpers/Api/Api'
import useApi from '@ors/hooks/useApi'

export default function SectionFView() {
  const params = useParams()
  const [apiSettings] = useState({
    options: {
      params: {
        cp_report_id: params.report_id,
      },
    },
    path: `api/country-programme/records`,
  })
  const { data } = useApi(apiSettings)

  const { results } = getResults(data?.section_f)

  return (
    <Box>
      <h2>Comments by bilateral/implementing agencies</h2>
    </Box>
  )
}
