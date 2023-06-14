import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions'
import { setSubstances, setUsage, setBlends } from '@/slices/reportSlice'
import { Blend, GroupSubstance, Usage } from '@/types/Reports'

export const reportEndpoints = (
  builder: EndpointBuilder<ReturnType<any>, string, 'api'>,
) => ({
  getSubstances: builder.query<GroupSubstance[], null>({
    query: () => ({
      url: '/group-substances?with_usages=true',
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
})
