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
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={anon(<LoginPage />)} />
      </Route>
    </Routes>
  )
}
