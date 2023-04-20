import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { API_URL } from '../constants'
import { RootState } from '../store'
import { authEndpoints } from './endpoints/authEndpoints'
import { userEndpoints } from './endpoints/userEndpoints'
import { selectAuthToken } from '@/slices/authSlice'

export const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = selectAuthToken(getState() as RootState)
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})

// Define a service using a base URL and expected endpoints
export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [],
  endpoints: builder => ({
    ...authEndpoints(builder),
    ...userEndpoints(builder),
  }),
})

export const { useLoginMutation, useGetMeQuery } = api
