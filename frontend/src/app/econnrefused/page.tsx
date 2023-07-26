import { Typography } from '@mui/material'

import { Error } from '@ors/components'

export default function Econnrefused() {
  return (
    <Error statusCode="ECONNREFUSED">
      <Typography className="mt-8">
        Connection to the server could not be established.
      </Typography>
      <Typography className="font-bold">
        We are working on fixing the issue!
      </Typography>
    </Error>
  )
}
