import Section, { Field } from './Section'

export type SectionDFormFields = {
  all_uses?: null | number | string
  destruction?: null | number | string // deprecated, removed in frontend
  other_uses_quantity?: null | number | string
  other_uses_remarks?: null | string
  feedstock?: null | number | string
}

export type DeserializedDataD = SectionDFormFields

export default class SectionD extends Section<
  DeserializedDataD,
  Record<keyof SectionDFormFields, Field>
> {
  constructor(
    initialData: Array<DeserializedDataD> = [],
    localStorageKey: null | string,
  ) {
    const formFields = {
      all_uses: { dataType: 'number', defaultValue: 0 },
      destruction: { dataType: 'number', defaultValue: 0 }, // deprecated, removed in frontend
      feedstock: { dataType: 'number', defaultValue: 0 },
      other_uses_quantity: { dataType: 'number', defaultValue: 0 },
      other_uses_remarks: { dataType: 'string', defaultValue: '' },
    }

    super(formFields, initialData, [], [], localStorageKey)
  }
}
