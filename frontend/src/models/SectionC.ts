import { includes } from 'lodash'

import Section, {
  Blend,
  DeserializedBlend,
  DeserializedSubstance,
  Field,
  Substance,
} from './Section'

export type SectionCFormFields = {
  current_year_price?: number
  previous_year_price?: number
  remarks?: string
}

export type DeserializedDataC =
  | (DeserializedBlend & SectionCFormFields)
  | (DeserializedSubstance & SectionCFormFields)

export default class SectionC extends Section<
  DeserializedDataC,
  Record<keyof SectionCFormFields, Field>
> {
  constructor(
    substances: Array<Substance>,
    blends: Array<Blend>,
    localStorageKey: string,
  ) {
    const formFields = {
      current_year_price: { dataType: 'number', defaultValue: 0 },
      previous_year_price: { dataType: 'number', defaultValue: 0 },
      remarks: { dataType: 'string', defaultValue: '' },
    }

    super(
      formFields,
      substances.filter((substance) => includes(substance.sections, 'C')),
      blends,
      localStorageKey,
    )
  }
}
