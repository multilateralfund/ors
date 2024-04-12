import { ApiBlend } from '@ors/types/api_blends'
import { EmptyFormSubstance } from '@ors/types/api_empty-form'
import { ApiSubstance } from '@ors/types/api_substances'

import {
  forOwn,
  get,
  groupBy,
  isArray,
  isBoolean,
  isEmpty,
  isNaN,
  isNull,
  isNumber,
  isObject,
  isString,
} from 'lodash'

import { parseNumber } from '@ors/helpers/Utils/Utils'

export type Field = { dataType: string; defaultValue: any }

export type Blend = {
  composition: string
  displayed_in_latest_format: boolean
  excluded_usages?: Array<number>
  group?: string
  id: number | string
  name: string
  sections?: Array<string>
}

export type DeserializedSubstance = {
  blend_id?: number
  display_name: string
  excluded_usages?: number[]
  group?: string
  mandatory: boolean
  row_id: string
  substance_id?: number
}

type LocalDeserializedData = {
  [key: string]: any
  error?: any
}

export default class Section<DeserializedData, FormFields> {
  private data: Array<DeserializedData & LocalDeserializedData> = []
  private formFields: FormFields
  public key = 'row_id'
  public localStorageKey: null | string = null

  constructor(
    formFields: FormFields,
    initialData: Array<DeserializedData & LocalDeserializedData> = [],
    substances: Array<EmptyFormSubstance> = [],
    blends: Array<EmptyFormSubstance> = [],
    localStorageKey: null | string,
  ) {
    this.formFields = formFields
    this.localStorageKey = localStorageKey

    let localStorageData:
      | Array<DeserializedData & LocalDeserializedData>
      | string =
      __CLIENT__ && this.localStorageKey
        ? window.sessionStorage.getItem(this.localStorageKey) || []
        : []
    if (isString(localStorageData)) {
      try {
        localStorageData = JSON.parse(localStorageData)
      } catch {}
    }

    this.data = this.union(
      [
        ...substances.map((substance) =>
          this.transformSubstance(substance, true),
        ),
        ...blends.map((blend) => this.transformBlend(blend, true)),
        ...initialData,
      ],
      [...(isArray(localStorageData) ? localStorageData : [])],
      substances,
      blends,
    )
  }

  public clearLocalStorage() {
    if (this.localStorageKey) {
      window.sessionStorage.removeItem(this.localStorageKey)
    }
  }

  public getData() {
    return this.data
  }

  public getFormFieldValue(field: any, _value: any) {
    const value = this.getFormattedValue(field, _value)
    if (
      isNull(value) ||
      (field.dataType === 'number' && (!isNumber(value) || isNaN(value))) ||
      (field.dataType === 'string' && !isString(value)) ||
      (field.dataType === 'date' && !isString(value)) ||
      (field.dataType === 'array' && !isArray(value)) ||
      (field.dataType === 'usage' && !isArray(value))
    ) {
      return field.defaultValue
    }
    if (field.dataType === 'usage') {
      return value.filter((usage: any) => {
        const quantity = parseNumber(usage.quantity)
        return usage.usage_id && isNumber(quantity) && !isNaN(quantity)
      })
    }
    return value
  }

  public getFormattedValue(field: any, value: any) {
    if (field.dataType === 'number') {
      return parseNumber(value)
    }
    return value
  }

  public getSubmitFormData(
    rows: Array<DeserializedData & LocalDeserializedData>,
  ) {
    if (!this.formFields) return []
    const formData: Array<DeserializedData & LocalDeserializedData> = []
    const cols = Object.keys(this.formFields).length

    rows.forEach((row: any) => {
      let emptyCols = 0
      const sanitizedRow: any = { ...row }

      forOwn(this.formFields, (field: any, fieldKey: any) => {
        const value = this.getFormFieldValue(field, row[fieldKey])
        if (
          row.mandatory &&
          (!value || ((isArray(value) || isObject(value)) && isEmpty(value)))
        ) {
          emptyCols++
          sanitizedRow[fieldKey] = value
          return
        }
        sanitizedRow[fieldKey] = row[fieldKey] || field.defaultValue
      })

      if (sanitizedRow.error) {
        delete sanitizedRow.error
      }

      if (emptyCols < cols) {
        formData.push(sanitizedRow)
      }
    })

    return formData
  }

  public transformApiBlend(blend: ApiBlend, mandatory?: boolean) {
    const transformed: Record<string, any> & ApiBlend = {
      ...blend,
      display_name: `${blend.name} (${blend.composition})`,
      row_id: `blend_${blend.id}`,
      ...(isBoolean(mandatory) ? { mandatory } : {}),
    }
    forOwn(this.formFields, (field, fieldKey) => {
      transformed[fieldKey] = this.getFormFieldValue(
        field,
        get(blend, fieldKey),
      )
    })
    return transformed
  }

  public transformApiSubstance(substance: ApiSubstance, mandatory?: boolean) {
    const transformed: Record<string, any> & ApiSubstance = {
      ...substance,
      display_name: substance.name,
      mandatory: false,
      row_id: `substance_${substance.id}`,
      ...(isBoolean(mandatory) ? { mandatory } : {}),
    }
    forOwn(this.formFields, (field, fieldKey) => {
      transformed[fieldKey] = this.getFormFieldValue(
        field,
        get(substance, fieldKey),
      )
    })
    return transformed
  }

  public transformBlend(blend: EmptyFormSubstance, mandatory?: boolean) {
    const transformed: Record<string, any> & EmptyFormSubstance = {
      ...blend,
      display_name: blend.chemical_name,
      row_id: `blend_${blend.blend_id}`,
      ...(isBoolean(mandatory) ? { mandatory } : {}),
    }
    forOwn(this.formFields, (field, fieldKey) => {
      transformed[fieldKey] = this.getFormFieldValue(
        field,
        get(blend, fieldKey),
      )
    })
    return transformed
  }

  public transformSubstance(
    substance: EmptyFormSubstance,
    mandatory?: boolean,
  ) {
    const transformed: Record<string, any> & EmptyFormSubstance = {
      ...substance,
      display_name: substance.chemical_name,
      mandatory: false,
      row_id: `substance_${substance.substance_id}`,
      ...(isBoolean(mandatory) ? { mandatory } : {}),
    }
    forOwn(this.formFields, (field, fieldKey) => {
      transformed[fieldKey] = this.getFormFieldValue(
        field,
        get(substance, fieldKey),
      )
    })
    return transformed
  }

  public union(
    original: Array<any>,
    updated: Array<any>,
    substances: Array<EmptyFormSubstance>,
    blends: Array<EmptyFormSubstance>,
  ) {
    const substancesById = groupBy(substances, 'substance_id')
    const blendsById = groupBy(blends, 'blend_id')
    const mergedMap = new Map()
    original.forEach((item: any) =>
      mergedMap.set(item[this.key], {
        ...(mergedMap.get(item[this.key]) || {}),
        ...item,
      }),
    )
    updated.forEach((data: any) => {
      const isSubstance = !!data.substance_id
      const isBlend = !!data.blend_id
      if (!data[this.key]) return
      if (
        (isSubstance && !substancesById[data.substance_id]) ||
        (isBlend && !blendsById[data.blend_id])
      ) {
        return
      }
      const originalItem = mergedMap.get(data[this.key])
      const parsedItem: Record<string, any> = originalItem ? {} : { ...data }

      forOwn(this.formFields, (field, fieldKey) => {
        parsedItem[fieldKey] = this.getFormFieldValue(field, data[fieldKey])
      })

      mergedMap.set(data[this.key], {
        ...(originalItem || {}),
        ...parsedItem,
        mandatory: originalItem?.mandatory || false,
      })
    })

    return Array.from(mergedMap.values())
  }

  public updateLocalStorage(
    newData: Array<DeserializedData & LocalDeserializedData>,
  ) {
    if (this.localStorageKey) {
      try {
        window.sessionStorage.setItem(
          this.localStorageKey,
          JSON.stringify(newData),
        )
      } catch {}
    }
  }
}
