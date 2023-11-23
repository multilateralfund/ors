import { Typography } from '@mui/material'
import { isString, omit, values } from 'lodash'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Error from '@ors/components/theme/Error/Error'

export default function BadRequest(props: { error: any }) {
  const { error } = props

  return (
    <FadeInOut className="h-full w-full">
      <Error statusCode="400">
        <Typography className="text-center font-bold" variant="h6">
          Bad request
        </Typography>
        <Typography>{error._info.message}</Typography>
        {values(omit(error, '_info')).map(
          (error, index) =>
            isString(error) && (
              <Typography key={index} className="text-center" variant="h6">
                {error}
              </Typography>
            ),
        )}
      </Error>
    </FadeInOut>
  )
}
