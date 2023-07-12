import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions'
import {
  setSubstances,
  setUsage,
  setBlends,
  setCountries,
  setCountryReports,
} from '@/slices/reportSlice'
import {
  Blend,
  Substance,
  Usage,
  Country,
  CountryReports,
  CountryReportsFilters,
} from '@/types/Reports'

export const reportEndpoints = (
  builder: EndpointBuilder<ReturnType<any>, string, 'api'>,
) => ({
  getSubstances: builder.query<Substance[], null>({
    query: () => ({
      url: '/substances?with_usages=true',
      method: 'GET',
      credentials: 'include',
    }),
    async onQueryStarted(args, { dispatch, queryFulfilled }) {
      try {
        const { data } = await queryFulfilled
        dispatch(setSubstances(data))
      } catch (error) {}
    },
  }),
  getBlends: builder.query<Blend[], null>({
    query: () => ({
      url: '/blends?with_usages=true',
      method: 'GET',
      credentials: 'include',
    }),
    async onQueryStarted(args, { dispatch, queryFulfilled }) {
      try {
        const { data } = await queryFulfilled
        dispatch(setBlends(data))
      } catch (error) {}
    },
  }),
  getUsage: builder.query<Usage[], null>({
    query: () => ({
      url: '/usages/',
      method: 'GET',
      credentials: 'include',
    }),
    async onQueryStarted(args, { dispatch, queryFulfilled }) {
      try {
        const { data } = await queryFulfilled
        dispatch(setUsage(data))
      } catch (error) {}
    },
  }),
  getCountries: builder.query<Country[], null>({
    query: () => ({
      url: '/countries/',
      method: 'GET',
      credentials: 'include',
    }),
    async onQueryStarted(args, { dispatch, queryFulfilled }) {
      try {
        const { data } = await queryFulfilled
        dispatch(setCountries(data))
      } catch (error) {}
    },
  }),
  getCountyReports: builder.query<
    CountryReports[],
    CountryReportsFilters | null
  >({
    query: params => ({
      url: 'country-programme/reports/',
      method: 'GET',
      params,
      credentials: 'include',
    }),
    async onQueryStarted(args, { dispatch, queryFulfilled }) {
      try {
        const { data } = await queryFulfilled
        dispatch(setCountryReports(data))
      } catch (error) {}
    },
  }),
})
