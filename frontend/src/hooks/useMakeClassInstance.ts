import { useRef } from 'react'

function useMakeClassInstance<T>(
  Class: { new (...args: any[]): T },
  props: Array<any> = [],
): T {
  const refObject: { current: T | null } = useRef(null)
  if (refObject.current === null) {
    refObject.current = new Class(...props)
  }
  return refObject.current || new Class(...props)
}

export default useMakeClassInstance
