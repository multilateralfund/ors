import React from 'react'
import { Routes, Route } from 'react-router-dom'
import {
  BaseLayout,
  RequireAuth,
  RequireAnonym,
  LoggedInLayout,
} from './layouts'

import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/auth/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { RecoverPassPage } from './pages/auth/RecoverPassPage'

const auth = (component: React.ReactElement) => (
  <RequireAuth>
    <LoggedInLayout>{component}</LoggedInLayout>
  </RequireAuth>
)

const anon = (component: React.ReactElement) => (
  <RequireAnonym>{component}</RequireAnonym>
)

export default function App() {
  return (
    <Routes>
      <Route element={<BaseLayout />}>
        <Route path="/" element={<LoginPage />} />
        <Route path="/forgot-password" element={anon(<RecoverPassPage />)} />
        <Route path="/profile" element={auth(<ProfilePage />)} />
      </Route>
    </Routes>
  )
}
