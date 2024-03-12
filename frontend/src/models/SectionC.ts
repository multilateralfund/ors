import { EmptyReportSubstance } from '@ors/types/api_empty-form'

import Section, { DeserializedSubstance, Field } from './Section'

export type SectionCFormFields = {
  current_year_price?: number
  previous_year_price?: number
  remarks?: string
}

export type DeserializedDataC = DeserializedSubstance & SectionCFormFields

export default class SectionC extends Section<
  DeserializedDataC,
  Record<keyof SectionCFormFields, Field>
> {
  constructor(
    initialData: Array<DeserializedDataC> = [],
    substances: Array<EmptyReportSubstance>,
    blends: Array<EmptyReportSubstance>,
    localStorageKey: null | string,
  ) {
    const formFields = {
      current_year_price: { dataType: 'number', defaultValue: 0 },
      previous_year_price: { dataType: 'number', defaultValue: 0 },
      remarks: { dataType: 'string', defaultValue: '' },
    }

    super(formFields, initialData, substances, blends, localStorageKey)
  }
}
