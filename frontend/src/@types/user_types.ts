export type UserType =
  | 'admin'
  | 'agency'
  | 'country_user'
  | 'secretariat'
  | 'stakeholder'

export const userCanViewReports: Record<UserType, boolean> = {
  admin: true,
  agency: true,
  country_user: true,
  secretariat: true,
  stakeholder: false,
}

export const userCanSubmitReport: Record<UserType, boolean> = {
  admin: true,
  agency: true,
  country_user: true,
  secretariat: true,
  stakeholder: false,
}

export const userCanExportData: Record<UserType, boolean> = {
  admin: true,
  agency: false,
  country_user: false,
  secretariat: true,
  stakeholder: false,
}
