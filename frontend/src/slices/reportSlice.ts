import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Substance, Usage, GroupSubstance } from '@/types/Reports'
import { RootState } from '../store'

interface SubstanceState {
  substances: GroupSubstance[]
  usage: Usage[]
}

const initialState: SubstanceState = {
  substances: [],
  usage: [],
}

export const reportSlice = createSlice({
  initialState,
  name: 'reportSlice',
  reducers: {
    setSubstances: (state, action: PayloadAction<Substance>) => {
      state.substances = action.payload
    },
    setUsage: (state, action: PayloadAction<Usage>) => {
      state.usage = action.payload
    },
  },
})

export const { setSubstances, setUsage } = reportSlice.actions

export const selectSubstancesAnnexA = (state: RootState) =>
  state.reports.substances
    ?.filter(substance => ['A', 'B', 'C'].includes(substance?.annex || ''))
    .map(item => ({
      label: item.name,
      options: item.substances?.map(subst => ({
        id: subst.id,
        value: subst.id,
        label: subst.name,
      })),
    }))

export const selectUsages = (state: RootState) => {
  return state.reports.usage
}

export const reportsReducer = reportSlice.reducer
