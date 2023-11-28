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
  constructor(
    initialData: Array<DeserializedDataD> = [],
    localStorageKey: null | string,
  ) {
    const formFields = {
      all_uses: { dataType: 'number', defaultValue: 0 },
      destruction: { dataType: 'number', defaultValue: 0 },
      feedstock: { dataType: 'number', defaultValue: 0 },
    }

    super(formFields, initialData, [], [], localStorageKey)
  }
}
