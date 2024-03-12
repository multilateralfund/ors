import { EmptyReportSubstance } from '@ors/types/api_empty-form'

import Section, { DeserializedSubstance, Field } from './Section'

export type SectionAFormFields = {
  banned_date?: null | string
  export_quotas?: number
  exports?: number
  import_quotas?: number
  imports?: number
  production?: number
  record_usages?: Array<number>
  remarks?: string
}

export type DeserializedDataA = DeserializedSubstance & SectionAFormFields

export default class SectionA extends Section<
  DeserializedDataA,
  Record<keyof SectionAFormFields, Field>
> {
  constructor(
    initialData: Array<DeserializedDataA> = [],
    substances: Array<EmptyReportSubstance>,
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

    super(formFields, initialData, substances, [], localStorageKey)
  }
}
