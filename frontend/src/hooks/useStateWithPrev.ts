'use client'
import React from 'react'

export default function useStateWithPrev<T>(value: any) {
  const [getState, setState] = React.useState<T>(value)
  const ref = React.useRef<T>(getState)

  React.useEffect(() => {
    ref.current = getState
  }, [getState])

  return [getState, setState, ref]
}
