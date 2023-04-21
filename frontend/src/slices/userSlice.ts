import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../store'
import { IUser } from '@/types/User'

interface IUserState {
  user: IUser | null
}

const initialState: IUserState = {
  user: null,
}

export const userSlice = createSlice({
  initialState,
  name: 'userSlice',
  reducers: {
    setUser: (state, action: PayloadAction<IUser>) => {
      state.user = action.payload
    },
  },
})

export const { setUser } = userSlice.actions

export const selectUser = (state: RootState) => state.user

export const userReducer = userSlice.reducer
