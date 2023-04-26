import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { api } from './services/api'
import { authReducer } from './slices/authSlice'
import { userReducer } from './slices/userSlice'
import { isRejectedWithValue, Middleware } from '@reduxjs/toolkit'
import { toast } from 'react-toastify'

export const rtkQueryErrorLogger: Middleware = () => next => action => {
  if (isRejectedWithValue(action)) {
    if (action.payload.status === 401) {
      //  Ignore 401 Authorization errors, user doesn't need to see them in message
    } else if (action.payload.status === 404) {
      toast.error('Error 404, related API endpoint is not found')
    } else if (action.payload.data && action.payload.data.message) {
      toast.error(action.payload.data.message)
    } else {
      toast.error(
        'Unknown error occured in the API. Please try again or reach administrator.',
      )
    }
  }

  return next(action)
}

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    user: userReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat(api.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
