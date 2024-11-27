import { ApiBPGet } from '@ors/types/api_bp_get'
import { ApiBPYearRange } from '@ors/types/api_bp_get_years'

import { PropsWithChildren } from 'react'

export interface BPContextType {
  data: ApiBPGet | null | undefined
  loaded: boolean
  loading: boolean
  params: Record<string, any>
  setParams: (params: Record<string, any>) => void
}
export interface BPProviderProps extends PropsWithChildren {
  status?: string
}
export interface BPYearRangesProviderProps extends PropsWithChildren {}

export interface BPYearRangesContextType {
  yearRanges: ApiBPYearRange[]
  yearRangesLoading: boolean
}
