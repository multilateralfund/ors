import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Usage, GroupSubstance } from '@/types/Reports'
import { RootState } from '../store'

type ReportData = {
  substance: string
}

interface SubstanceState {
  substances: GroupSubstance[]
  usage: Usage[]
  data: Partial<ReportData>[]
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
    setReports: (state, action: PayloadAction<any>) => {
      state.data.push(action.payload)
    },
    updateReport: (state, action: PayloadAction<any>) => {
      const substanceIndex = state.data.findIndex(
        item => item.substance == action.payload.substance,
      )
      state.data[substanceIndex] = action.payload
    },
    deleteReport: (state, action: PayloadAction<any>) => {
      state.data = state.data.filter(
        item => item.substance != action.payload.substance,
      )
    },
  },
})

export const {
  setSubstances,
  setUsage,
  setReports,
  updateReport,
  deleteReport,
} = reportSlice.actions

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
