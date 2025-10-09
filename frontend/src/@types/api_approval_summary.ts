type ComputedValue = {
  projects_count: number
  hcfc: string
  hfc: string
  project_funding: string
  project_support_cost: string
  total: string
}

type BaseSummary = {
  phase_out_plan: ComputedValue
  hfc_phase_down: ComputedValue
  energy_efficiency: ComputedValue
  total: ComputedValue
}

export type ApiApprovalSummary = {
  projects: {
    data: {
      id: string
      code: string
      version: number
      status_submission: string
      status_project: string
    }[]
    count: number
  }
  bilateral_cooperation: BaseSummary & {
    destruction: ComputedValue
  }
  investment_project: BaseSummary
  work_programme_amendment: BaseSummary & {
    destruction: ComputedValue
    several: ComputedValue
  }
  summary_by_parties_and_implementing_agencies: {
    name: string
    type: 'agency' | 'country'
    value: ComputedValue
  }[]
}
