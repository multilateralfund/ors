import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { IUser } from '@/types/User'
import { RootState } from '../store'
import { LanguagesKeys } from '@/utils/constants'

interface IUserState {
  user: IUser | null
  theme: string | undefined
  lang: LanguagesKeys
}

const initialState: IUserState = {
  user: null,
  theme: undefined,
  lang: 'en',
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
    setLang: (state, action: PayloadAction<{ lang: string }>) => {
      if (action.payload.lang) {
        localStorage.setItem('lang', action.payload.lang)
      }
      state.theme = action.payload.lang
    },
  },
})

export const { setUser, setTheme, setLang } = userSlice.actions

export const selectUser = (state: RootState) => state.user
export const selectLang = (state: RootState) =>
  localStorage.getItem('lang') || state.user.lang

export const userReducer = userSlice.reducer
