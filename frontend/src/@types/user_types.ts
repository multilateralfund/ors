export type UserType =
  | 'admin'
  | 'agency'
  | 'country_submitter'
  | 'country_user'
  | 'secretariat'
  | 'stakeholder'

export const userCanViewReports: Record<UserType, boolean> = {
  admin: true,
  agency: true,
  country_submitter: true,
  country_user: true,
  secretariat: true,
  stakeholder: false,
}

export const userCanSubmitReport: Record<UserType, boolean> = {
  admin: true,
  agency: true,
  country_submitter: true,
  country_user: true,
  secretariat: true,
  stakeholder: false,
}

export const userCanSubmitFinalReport: Record<UserType, boolean> = {
  admin: true,
  agency: true,
  country_submitter: true,
  country_user: false,
  secretariat: true,
  stakeholder: false,
}

export const userCanExportData: Record<UserType, boolean> = {
  admin: true,
  agency: false,
  country_submitter: true,
  country_user: false,
  secretariat: true,
  stakeholder: false,
}

export const userCanCommentCountry: Record<UserType, boolean> = {
  admin: true,
  agency: false,
  country_submitter: true,
  country_user: true,
  secretariat: false,
  stakeholder: false,
}

export const userCanCommentSecretariat: Record<UserType, boolean> = {
  admin: true,
  agency: false,
  country_submitter: false,
  country_user: false,
  secretariat: true,
  stakeholder: false,
}

export const isCountryUserType: Record<UserType, boolean> = {
  admin: false,
  agency: false,
  country_submitter: true,
  country_user: true,
  secretariat: false,
  stakeholder: false,
}
