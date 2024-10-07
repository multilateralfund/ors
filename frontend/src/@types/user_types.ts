import { ApiUserType as UserType } from './api_auth_user'

export type { UserType }

export const userCanViewReports: Record<UserType, boolean> = {
  admin: true,
  agency_inputter: true,
  agency_submitter: true,
  country_submitter: true,
  country_user: true,
  secretariat: true,
  stakeholder: false,
  treasurer: false,
  viewer: true,
}

export const userCanSubmitReport: Record<UserType, boolean> = {
  admin: true,
  agency_inputter: true,
  agency_submitter: true,
  country_submitter: true,
  country_user: true,
  secretariat: true,
  stakeholder: false,
  treasurer: false,
  viewer: false,
}

export const userCanSubmitFinalReport: Record<UserType, boolean> = {
  admin: true,
  agency_inputter: false,
  agency_submitter: true,
  country_submitter: true,
  country_user: false,
  secretariat: true,
  stakeholder: false,
  treasurer: false,
  viewer: false,
}

export const userCanDeleteCurrentDraft: Record<UserType, boolean> = {
  admin: true,
  agency_inputter: false,
  agency_submitter: false,
  country_submitter: false,
  country_user: false,
  secretariat: true,
  stakeholder: false,
  treasurer: false,
  viewer: false,
}

export const userCanExportData: Record<UserType, boolean> = {
  admin: true,
  agency_inputter: false,
  agency_submitter: false,
  country_submitter: true,
  country_user: false,
  secretariat: true,
  stakeholder: false,
  treasurer: false,
  viewer: false,
}

export const userCanCommentCountry: Record<UserType, boolean> = {
  admin: true,
  agency_inputter: false,
  agency_submitter: false,
  country_submitter: true,
  country_user: true,
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
  secretariat: false,
  stakeholder: false,
  treasurer: false,
  viewer: false,
}

export const userCanEditBusinessPlan: Record<UserType, boolean> = {
  admin: true,
  agency_inputter: true,
  agency_submitter: true,
  country_submitter: false,
  country_user: false,
  secretariat: true,
  stakeholder: false,
  treasurer: false,
  viewer: false,
}
