import { createApi } from '@reduxjs/toolkit/query/react'
import {
  BaseQueryFn,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query'
import { selectAuthToken, selectAuthState, logout } from '@/slices/authSlice'
import { Mutex } from 'async-mutex'
import { env } from '@/utils/env'
import { userEndpoints } from './endpoints/userEndpoints'
import { authEndpoints } from './endpoints/authEndpoints'
import { RootState } from '../store'

const baseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
  prepareHeaders: (headers, { getState }) => {
    const authState = selectAuthState(getState() as RootState)
    if (authState.access_token) {
      headers.set('Authorization', `Bearer ${authState.access_token}`)
    }
    return headers
  },
})

// Create a new mutex
const mutex = new Mutex()

const customFetchBase: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // wait until the mutex is available without locking it
  await mutex.waitForUnlock()
  let result = await baseQuery(args, api, extraOptions)

  if (
    (result.error?.data as any)?.detail ===
    'Given token not valid for any token type'
  ) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire()

      try {
        const refreshResult = await baseQuery(
          { credentials: 'include', url: 'auth/refresh/' },
          api,
          extraOptions,
        )

        if (refreshResult.data) {
          // Retry the initial query
          result = await baseQuery(args, api, extraOptions)
        } else {
          api.dispatch(logout())
          window.location.href = '/'
        }
      } finally {
        // release must be called once the mutex should be released again.
        release()
      }
    } else {
      // wait until the mutex is available without locking it
      await mutex.waitForUnlock()
      result = await baseQuery(args, api, extraOptions)
    }
  }

  return result
}

// Define a service using a base URL and expected endpoints
export const api = createApi({
  reducerPath: 'api',
  baseQuery: customFetchBase,
  tagTypes: [],
  endpoints: builder => ({
    ...authEndpoints(builder),
    ...userEndpoints(builder),
  }),
})

export const {
  useLoginMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetMeQuery,
} = api
