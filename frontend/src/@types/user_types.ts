export type UserType = 'agency' | 'country_user' | 'secretariat' | 'stakeholder'

export const userTypeVisibility: Record<UserType, boolean> = {
  agency: false,
  country_user: true,
  secretariat: true,
  stakeholder: false,
}
