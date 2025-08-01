import { ApiUserType as UserType } from './api_auth_user'

export type { UserType }

export const userCanCommentCountry: Record<UserType, boolean> = {
  admin: true,
  agency_inputter: false,
  agency_submitter: false,
  country_submitter: true,
  country_user: true,
  cp_viewer: false,
  secretariat: false,
  stakeholder: false,
  treasurer: false,
  viewer: false,
}

export const userCanCommentSecretariat: Record<UserType, boolean> = {
  admin: true,
  agency_inputter: false,
  agency_submitter: false,
  country_submitter: false,
  country_user: false,
  cp_viewer: false,
  secretariat: true,
  stakeholder: false,
  treasurer: false,
  viewer: false,
}

export const isCountryUserType: Record<UserType, boolean> = {
  admin: false,
  agency_inputter: false,
  agency_submitter: false,
  country_submitter: true,
  country_user: true,
  cp_viewer: false,
  secretariat: false,
  stakeholder: false,
  treasurer: false,
  viewer: false,
}
