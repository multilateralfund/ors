// Response from /api/auth/user/

export type ApiUserType =
  | 'admin'
  | 'agency_inputter'
  | 'agency_submitter'
  | 'country_submitter'
  | 'country_user'
  | 'secretariat'
  | 'stakeholder'
  | 'treasurer'
  | 'viewer'

export type ApiUser = {
  country?: null | string
  country_id?: number
  email: string
  first_name: string
  full_name: string
  last_name: string
  pk: number
  user_type: ApiUserType
  username: string
}
