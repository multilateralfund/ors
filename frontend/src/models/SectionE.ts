import Section, { Field } from './Section'

export type SectionEFormFields = {
  all_uses?: null | number | string
  stored_at_start_of_year?: null | number | string
  destruction?: null | number | string
  destruction_wpc?: null | number | string
  facility?: null | string | string
  feedstock_gc?: null | number | string
  stored_at_end_of_year?: null | number | string
  generated_emissions?: null | number | string
  remarks?: null | string
  total?: null | number | string
}

export type DeserializedDataE = SectionEFormFields

export default class SectionE extends Section<
  DeserializedDataE,
  Record<keyof SectionEFormFields, Field>
> {
  constructor(
    initialData: Array<DeserializedDataE> = [],
    localStorageKey: null | string,
  ) {
    const formFields = {
      all_uses: { dataType: 'number', defaultValue: 0 },
      stored_at_start_of_year: { dataType: 'number', defaultValue: 0 },
      destruction: { dataType: 'number', defaultValue: 0 },
      destruction_wpc: { dataType: 'number', defaultValue: 0 },
      facility: { dataType: 'string', defaultValue: '' },
      feedstock_gc: { dataType: 'number', defaultValue: 0 },
      feedstock_wpc: { dataType: 'number', defaultValue: 0 },
      generated_emissions: { dataType: 'number', defaultValue: 0 },
      stored_at_end_of_year: { dataType: 'number', defaultValue: 0 },
      remarks: { dataType: 'string', defaultValue: '' },
      total: { dataType: 'number', defaultValue: 0 },
    }

    super(formFields, initialData, [], [], localStorageKey)
  }
}
