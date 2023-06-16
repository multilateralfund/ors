import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  Usage,
  Blend,
  Chemical,
  GroupSubstance,
  SectionsType,
  Country,
  CountryReports,
  CountryReportsFilters,
} from '@/types/Reports'
import { RootState } from '../store'

export type ReportDataType = {
  substance?: Chemical
  usage?: number[]
  import?: number
  export?: number
  production?: number
}

interface SubstanceState {
  substances: GroupSubstance[]
  usage: Usage[]
  blends: Blend[]
  countries?: Country[]
  data: Record<string, ReportDataType[]>
  countryReports?: CountryReports[]
  countryReportsFilters: CountryReportsFilters | null
}

const initialState: SubstanceState = {
  substances: [],
  usage: [],
  blends: [],
  data: {},
  countries: [],
  countryReports: [],
  countryReportsFilters: null,
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
    setCountries: (state, action: PayloadAction<Country[]>) => {
      state.countries = action.payload
    },
    setBlends: (state, action: PayloadAction<Blend[]>) => {
      state.blends = action.payload
    },
    setCountryReports: (state, action: PayloadAction<CountryReports[]>) => {
      state.countryReports = action.payload
    },
    setCountryReportsFilters: (
      state,
      action: PayloadAction<CountryReportsFilters>,
    ) => {
      state.countryReportsFilters = action.payload
    },
    setReports: (
      state,
      action: PayloadAction<{
        sectionId: number
        values: ReportDataType
      }>,
    ) => {
      const { sectionId, values } = action.payload
      if (!state.data[`section-${sectionId}`]) {
        state.data[`section-${sectionId}`] = []
      }

      state.data[`section-${sectionId}`].push(values)

      return state
    },
    updateReport: (
      state,
      action: PayloadAction<{
        sectionId: number
        values: ReportDataType
      }>,
    ) => {
      const { sectionId, values } = action.payload
      const substanceId = state.data[`section-${sectionId}`].findIndex(
        item => item.substance?.id === values.substance?.id,
      )
      state.data[`section-${sectionId}`][substanceId] = values
    },
    deleteReport: (
      state,
      action: PayloadAction<{ sectionId: number; substanceId: number }>,
    ) => {
      const { sectionId, substanceId } = action.payload
      state.data[`section-${sectionId}`] = state.data[
        `section-${sectionId}`
      ].filter(item => item.substance?.id != substanceId)
    },
  },
})

export const {
  setSubstances,
  setUsage,
  setReports,
  setBlends,
  setCountries,
  setCountryReports,
  setCountryReportsFilters,
  updateReport,
  deleteReport,
} = reportSlice.actions

export const selectChemicalBySection = (
  state: RootState,
  withSection: Partial<SectionsType>,
): {
  label: string
  options:
    | {
        id: number
        value: number
        label: string
        excluded_usages: number[]
      }[]
    | undefined
}[] =>
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

export const selectBlends = (state: RootState) =>
  state.reports.blends.map(item => ({
    label: item.name,
    ...item,
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

export const selectUsages = (state: RootState) => state.reports.usage

export const selectRecordsDataBySection = (
  state: RootState,
  sectionId: number,
): ReportDataType[] | undefined =>
  state.reports.data[`section-${sectionId}`] || []

export const selectCountries = (state: RootState) => state.reports.countries

export const selectCountryReports = (state: RootState) =>
  state.reports.countryReports

export const selectCountryReportsFilters = (state: RootState) =>
  state.reports.countryReportsFilters

export const reportsReducer = reportSlice.reducer
