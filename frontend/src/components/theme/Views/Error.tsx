import { useMemo } from 'react'

import { getErrorView } from './View'

export default function Error({ error }: any) {
  const RenderedError = useMemo(
    () => getErrorView(error?._info?.status) || (() => null),
    [error],
  )

  return <RenderedError error={error} />
}
