import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions'
import { setUser } from '@/slices/userSlice'
import { IUser } from '@/types/User'

export const userEndpoints = (
  builder: EndpointBuilder<ReturnType<any>, string, 'api'>,
) => ({
  getMe: builder.query<IUser, null>({
    query: () => ({
      url: '/auth/user/',
      method: 'GET',
    }),
    async onQueryStarted(args, { dispatch, queryFulfilled }) {
      try {
        const { data } = await queryFulfilled
        dispatch(setUser(data))
      } catch (error) {}
    },
  }),
})
