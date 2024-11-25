import { ApiSubstance } from '@ors/types/api_substances'

export type SubstancePrice = {
  blend_id: null | number
  current_year_price: string
  previous_year_price: string
  remarks: string
  substance_id: null | number
}
export type SubstancePrices = SubstancePrice[]

export interface CreateSubstanceProps {
  onCancel: () => void
  onSubmit: (subst: ApiSubstance) => void
}

export interface AddSubstanceProps {
  autoCompleteFilterOptions: (options: any[], state: any) => any[]
  autoCompleteRenderOption: (props: any, option: any, state: any) => JSX.Element
  mandatorySubstances: any[]
  onAddChemical: (event: any, newChemical: any) => void
  onCancel: () => void
  optionalSubstances: any[]
}
