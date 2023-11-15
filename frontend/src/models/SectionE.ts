import Section, { Field } from './Section'

export type SectionEFormFields = {
  all_uses?: number
  destruction?: number
  destruction_wpc?: number
  facility?: string
  feedstock_gc?: number
  generated_emissions?: number
  remarks?: string
  total?: number
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
      destruction: { dataType: 'number', defaultValue: 0 },
      destruction_wpc: { dataType: 'number', defaultValue: 0 },
      facility: { dataType: 'string', defaultValue: '' },
      feedstock_gc: { dataType: 'number', defaultValue: 0 },
      feedstock_wpc: { dataType: 'number', defaultValue: 0 },
      generated_emissions: { dataType: 'number', defaultValue: 0 },
      remarks: { dataType: 'string', defaultValue: '' },
      total: { dataType: 'number', defaultValue: 0 },
    }

    super(formFields, initialData, [], [], localStorageKey)
  }
}
