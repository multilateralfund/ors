import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { IUser } from '@/types/User'
import { RootState } from '../store'

interface IUserState {
  user: IUser | null
  theme: string | undefined
}

const initialState: IUserState = {
  user: null,
  theme: undefined,
}

export const userSlice = createSlice({
  initialState,
  name: 'userSlice',
  reducers: {
    setUser: (state, action: PayloadAction<IUser>) => {
      state.user = action.payload
    },
    setTheme: (state, action: PayloadAction<{ mode: string | undefined }>) => {
      if (action.payload.mode) {
        localStorage.setItem('theme', action.payload.mode)
      }
      state.theme = action.payload.mode
    },
  },
})

export const { setUser, setTheme } = userSlice.actions

export const selectUser = (state: RootState) => state.user

export const userReducer = userSlice.reducer
