import Base from '@ors/registry'

export type ApiProjectSettings = {
  project_submission_notifications_enabled: boolean
  project_submission_notifications_emails: string
  project_recommendation_notifications_enabled: boolean
  project_recommendation_notifications_emails: string
  apr_agency_submission_notifications_enabled: boolean
  apr_agency_submission_notifications_emails: string
  total_savings_to_society_in_us_dollar: string
  total_avoided_emissions_of_ods_in_odp_tonnes: string
  total_avoided_emissions_of_controlled_substances_in_co2_eq_tonnes: string
  cost_to_the_fund_to_remove_1_odp_tonne_from_ods: string
  cost_to_the_fund_to_remove_1_co2_eq_tonne_from_controlled_substances: string
  expected_avoided_emissions_from_hfcs_in_co2_eq_tonnes: string
  expected_cost_to_the_fund_to_remove_1_co2_eq_tonne_from_hfcs: string
  global_field_1: string
  global_field_2: string
  global_field_3: string
}

type ValidateKeys<T extends readonly (keyof ApiProjectSettings)[]> = T

type StringField = {
  default: string
  title: string
  type: string
}

type BooleanField = {
  default: boolean
} & StringField

export type ApiProjectSettingsForFrontend = {
  data: ApiProjectSettings
  sections: {
    Emails: ValidateKeys<
      [
        'project_submission_notifications_enabled',
        'project_submission_notifications_emails',
        'project_recommendation_notifications_enabled',
        'project_recommendation_notifications_emails',
        'apr_agency_submission_notifications_enabled',
        'apr_agency_submission_notifications_emails',
      ]
    >
    Projects: ValidateKeys<
      [
        'total_savings_to_society_in_us_dollar',
        'total_avoided_emissions_of_ods_in_odp_tonnes',
        'total_avoided_emissions_of_controlled_substances_in_co2_eq_tonnes',
        'cost_to_the_fund_to_remove_1_odp_tonne_from_ods',
        'cost_to_the_fund_to_remove_1_co2_eq_tonne_from_controlled_substances',
        'expected_avoided_emissions_from_hfcs_in_co2_eq_tonnes',
        'expected_cost_to_the_fund_to_remove_1_co2_eq_tonne_from_hfcs',
        'global_field_1',
        'global_field_2',
        'global_field_3',
      ]
    >
  }
  fields: {
    project_submission_notifications_enabled: BooleanField
    project_submission_notifications_emails: StringField
    project_recommendation_notifications_enabled: BooleanField
    project_recommendation_notifications_emails: StringField
    apr_agency_submission_notifications_enabled: BooleanField
    apr_agency_submission_notifications_emails: StringField
    total_savings_to_society_in_us_dollar: StringField
    total_avoided_emissions_of_ods_in_odp_tonnes: StringField
    total_avoided_emissions_of_controlled_substances_in_co2_eq_tonnes: StringField
    cost_to_the_fund_to_remove_1_odp_tonne_from_ods: StringField
    cost_to_the_fund_to_remove_1_co2_eq_tonne_from_controlled_substances: StringField
    expected_avoided_emissions_from_hfcs_in_co2_eq_tonnes: StringField
    expected_cost_to_the_fund_to_remove_1_co2_eq_tonne_from_hfcs: StringField
    global_field_1: StringField
    global_field_2: StringField
    global_field_3: StringField
  }
}
