import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../store'

interface AuthState {
  access_token?: string
  refresh_token?: string
  token_exp?: string
}

const initialState: AuthState = {
  access_token: localStorage.getItem('access_token') || undefined,
  refresh_token: localStorage.getItem('refresh_token') || undefined,
  token_exp: localStorage.getItem('token_exp') || undefined,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (
      state,
      action: PayloadAction<{ access_token: string; refresh_token: string }>,
    ) => {
      state.access_token = action.payload.access_token
      state.refresh_token = action.payload.refresh_token
      localStorage.setItem('access_token', action.payload.access_token)
      localStorage.setItem('refresh_token', action.payload.refresh_token)
      localStorage.setItem('token_exp', new Date().toUTCString())
    },
    logout: state => {
      state.access_token = undefined
      state.refresh_token = undefined
      state.token_exp = undefined
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('token_exp')
    },
  },
})

export const { setToken, logout } = authSlice.actions

export const selectAuthToken = (state: RootState) => state.auth.access_token
export const selectAuthState = (state: RootState) => state.auth

export const authReducer = authSlice.reducer
