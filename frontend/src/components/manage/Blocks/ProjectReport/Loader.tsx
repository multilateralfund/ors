import React from 'react'
import Loading from '@ors/components/theme/Loading/Loading.tsx'

export default function Loader({ active }: { active: boolean }) {
  return (
    <Loading className="!fixed bg-action-disabledBackground" active={active} />
  )
}
