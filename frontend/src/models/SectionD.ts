import Section, { DeserializedSubstance, Field } from './Section'

export type SectionDFormFields = {
  all_uses?: number
  destruction?: number
  feedstock?: number
}

export type DeserializedDataD = DeserializedSubstance & SectionDFormFields

export default class SectionD extends Section<
  DeserializedDataD,
  Record<keyof SectionDFormFields, Field>
> {
  constructor(localStorageKey: string) {
    const formFields = {
      all_uses: { dataType: 'number', defaultValue: 0 },
      destruction: { dataType: 'number', defaultValue: 0 },
      feedstock: { dataType: 'number', defaultValue: 0 },
    }

    super(
      formFields,
      [{ id: 'hfc_23', displayed_in_latest_format: true, name: 'HFC-23' }],
      [],
      localStorageKey,
    )
  }
}
