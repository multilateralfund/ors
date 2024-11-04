import {
  Dispatch,
  PropsWithChildren,
  createContext,
  useContext,
  useReducer,
} from 'react'

import { BPCreateAction } from '@ors/components/manage/Blocks/BusinessPlans/BPCreate/Provider/actions'
import {
  BPCreateState,
  bpReducer,
  useInitialState,
} from '@ors/components/manage/Blocks/BusinessPlans/BPCreate/Provider/state'

const BPCreateContext = createContext<BPCreateState>(
  null as unknown as BPCreateState,
)
const BPDispatchContext = createContext<Dispatch<BPCreateAction>>(
  null as unknown as Dispatch<BPCreateAction>,
)

export default function BPCreateProvider(props: PropsWithChildren) {
  const { children } = props
  const [state, dispatch] = useReducer(bpReducer, useInitialState())
  return (
    <BPCreateContext.Provider value={state}>
      <BPDispatchContext.Provider value={dispatch}>
        {children}
      </BPDispatchContext.Provider>
    </BPCreateContext.Provider>
  )
}

export function useBPCreate() {
  return useContext(BPCreateContext)
}

export function useBPCreateDispatch() {
  return useContext(BPDispatchContext)
}
