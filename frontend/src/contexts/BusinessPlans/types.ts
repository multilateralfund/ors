import { ApiBPGet } from '@ors/types/api_bp_get'

import { PropsWithChildren } from 'react'

export interface BPContextType {
  data: ApiBPGet | null | undefined
  isViewer: boolean
  loaded: boolean
  loading: boolean
  params: Record<string, any>
  setParams: (params: Record<string, any>) => void
}
export interface BPProviderProps extends PropsWithChildren {}
export interface BPYearRangesProviderProps extends PropsWithChildren {}

export interface BPYearRangesContextType {
  yearRanges: any[]
  yearRangesLoading: boolean
}
