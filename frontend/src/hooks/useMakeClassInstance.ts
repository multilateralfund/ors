import { useRef } from 'react'
function useMakeClassInstance<T>(Class: any, props: Array<any> = []) {
  const refObject: { current: T | null } = useRef(null)
  if (refObject.current === null) {
    refObject.current = new Class(...props)
  }
  return refObject.current || new Class(...props)
}
export default useMakeClassInstance
