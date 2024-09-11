import { PropsWithChildren } from 'react'

export interface BPContextType {
  data: any
  loaded: boolean
  loading: boolean
  params: Record<string, any>
  setParams: (params: Record<string, any>) => void
}
export interface BPProviderProps extends PropsWithChildren {}
