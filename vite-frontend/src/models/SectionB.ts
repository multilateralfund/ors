import { EmptyFormSubstance } from '@ors/types/api_empty-form'

import Section, { DeserializedSubstance, Field } from './Section'

export type SectionBFormFields = {
  banned_date?: null | string
  export_quotas?: number
  exports?: number
  import_quotas?: number
  imports?: number
  production?: number
  record_usages?: number[]
  remarks?: string
}

export type DeserializedDataB = DeserializedSubstance & SectionBFormFields

export default class SectionB extends Section<
  DeserializedDataB,
  Record<keyof SectionBFormFields, Field>
> {
  constructor(
    initialData: Array<DeserializedDataB> = [],
    substances: Array<EmptyFormSubstance>,
    blends: Array<EmptyFormSubstance>,
    localStorageKey: null | string,
  ) {
    const formFields = {
      banned_date: { dataType: 'date', defaultValue: null },
      export_quotas: { dataType: 'number', defaultValue: 0 },
      exports: { dataType: 'number', defaultValue: 0 },
      import_quotas: { dataType: 'number', defaultValue: 0 },
      imports: { dataType: 'number', defaultValue: 0 },
      production: { dataType: 'number', defaultValue: 0 },
      record_usages: { dataType: 'usage', defaultValue: [] },
      remarks: { dataType: 'string', defaultValue: '' },
    }

    super(formFields, initialData, substances, blends, localStorageKey)
  }
}
