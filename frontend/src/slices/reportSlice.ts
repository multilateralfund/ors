import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Usage, GroupSubstance } from '@/types/Reports'
import { RootState } from '../store'

interface SubstanceState {
  substances: GroupSubstance[]
  usage: Usage[]
  data: unknown[]
}

const initialState: SubstanceState = {
  substances: [],
  usage: [],
  data: [],
}

export const reportSlice = createSlice({
  initialState,
  name: 'reportSlice',
  reducers: {
    setSubstances: (state, action: PayloadAction<GroupSubstance[]>) => {
      state.substances = action.payload
    },
    setUsage: (state, action: PayloadAction<Usage[]>) => {
      state.usage = action.payload
    },
    setReports: (state, action: PayloadAction<unknown[]>) => {
      state.data.push(action.payload)
    },
  },
})

export const { setSubstances, setUsage, setReports } = reportSlice.actions

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

export const selectRecordsData = (state: RootState) => state.reports.data

export const reportsReducer = reportSlice.reducer
