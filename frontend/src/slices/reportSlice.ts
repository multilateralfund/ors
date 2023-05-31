import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Usage, GroupSubstance, SectionsType } from '@/types/Reports'
import { RootState } from '../store'

export type ReportDataType = {
  substance: {
    id: number
    label: string
  }
  usages: any[]
}

interface SubstanceState {
  substances: GroupSubstance[]
  usage: Usage[]
  data: Record<string, any[]>
}

const initialState: SubstanceState = {
  substances: [],
  usage: [],
  data: {},
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
    setReports: (
      state,
      action: PayloadAction<{ sectionId: number; values: any }>,
    ) => {
      const { sectionId, values } = action.payload
      if (!state.data[`section-${sectionId}`]) {
        state.data[`section-${sectionId}`] = []
      }

      state.data[`section-${sectionId}`].push(values)

      return state
    },
    // updateReport: (state, action: PayloadAction<any>) => {
    //   const substanceIndex = state.data.findIndex(
    //     item => item.substance == action.payload.substance,
    //   )
    //   state.data[substanceIndex] = action.payload
    // },
    // deleteReport: (state, action: PayloadAction<any>) => {
    //   state.data = state.data.filter(
    //     item => item.substance != action.payload.substance,
    //   )
    // },
  },
})

export const {
  setSubstances,
  setUsage,
  setReports,
  updateReport,
  deleteReport,
} = reportSlice.actions

export const selectSubstancesBySection = (
  state: RootState,
  withSection: Partial<SectionsType>,
) =>
  state.reports.substances
    ?.filter(substance =>
      withSection.substances?.includes(substance?.name || ''),
    )
    .map(item => ({
      label: item.name,
      options: item.substances?.map(subst => ({
        id: subst.id,
        value: subst.id,
        label: subst.name,
        excluded_usages: subst.excluded_usages,
      })),
    }))

export const selectUsagesBySection = (
  state: RootState,
  withSection: Partial<SectionsType>,
) => {
  const usagesSection = withSection.usages || []
  return state.reports.usage
    .filter(usage => usagesSection.includes(usage.full_name))
    .sort((a, b) => a.sort_order - b.sort_order)
}
export const selectRecordsDataBySection = (
  state: RootState,
  sectionId: number,
) => state.reports.data[`section-${sectionId}`] || []

export const reportsReducer = reportSlice.reducer
