import React from 'react'
import { Routes, Route } from 'react-router-dom'
import {
  BaseLayout,
  RequireAuth,
  RequireAnonym,
  LoggedInLayout,
} from './layouts'

import { LoginPage } from './pages/auth/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { RecoverPassPage } from './pages/auth/RecoverPassPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { EmailVerificationPage } from './pages/auth/EmailVerificationPage'
import { HomePage } from './pages/HomePage'
import { RequireUser } from './layouts/RequireUser'
import { UnauthorizedPage } from './pages/UnauthorizePage'

const auth = (component: React.ReactElement) => (
  <LoggedInLayout>{component}</LoggedInLayout>
)

const anon = (component: React.ReactElement) => (
  <RequireAnonym>{component}</RequireAnonym>
)

export default function App() {
  return (
    <Routes>
      <Route element={<BaseLayout />}>
        <Route element={<RequireUser allowedRoles={['user', 'admin']} />}>
          <Route path="/" element={auth(<HomePage />)} />
        </Route>
        <Route path="/unauthorized" element={anon(<UnauthorizedPage />)} />
        <Route path="/login" element={anon(<LoginPage />)} />
        <Route path="/forgot-password" element={anon(<RecoverPassPage />)} />
        <Route path="/reset-password" element={anon(<ResetPasswordPage />)}>
          <Route path=":uid/:token" element={anon(<ResetPasswordPage />)} />
        </Route>
        <Route path="/verify-email" element={anon(<EmailVerificationPage />)}>
          <Route
            path=":verificationCode"
            element={anon(<EmailVerificationPage />)}
          />
        </Route>
        <Route path="/profile" element={auth(<ProfilePage />)} />
      </Route>
    </Routes>
  )
}
