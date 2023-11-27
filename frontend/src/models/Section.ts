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

export type Substance = {
  displayed_in_latest_format: boolean
  excluded_usages?: Array<number>
  group?: string
  id: number | string
  name: string
  sections?: Array<string>
}

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
  display_name: string
  excluded_usages?: Array<number>
  group?: string
  mandatory: boolean
  row_id: string
  substance_id: number
}

export type DeserializedBlend = {
  blend_id: number
  display_name: string
  group?: string
  mandatory: boolean
  row_id: string
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
    substances: Array<Substance> = [],
    blends: Array<Blend> = [],
    localStorageKey: null | string,
  ) {
    this.formFields = formFields
    this.localStorageKey = localStorageKey

    let localStorageData:
      | Array<DeserializedData & LocalDeserializedData>
      | string =
      __CLIENT__ && this.localStorageKey
        ? window.localStorage.getItem(this.localStorageKey) || []
        : []
    if (isString(localStorageData)) {
      try {
        localStorageData = JSON.parse(localStorageData)
      } catch {}
    }

    this.data = this.union(
      [
        ...substances
          .filter(
            (substance: Substance) => substance.displayed_in_latest_format,
          )
          .map((substance: Substance) =>
            this.transformSubstance(substance, true),
          ),
        ...blends
          .filter((blend: Blend) => blend.displayed_in_latest_format)
          .map((blend: Blend) => this.transformBlend(blend, true)),
      ],
      [...initialData, ...(isArray(localStorageData) ? localStorageData : [])],
      substances,
      blends,
    )
  }

  public clearLocalStorage() {
    if (this.localStorageKey) {
      window.localStorage.removeItem(this.localStorageKey)
    }
  }

  public getData() {
    return this.data
  }

  public getFormFieldValue(field: any, value: any) {
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

    console.log('HERE', formData)

    return formData
  }

  public transformBlend(blend: Blend, mandatory?: boolean) {
    const id = get(blend, 'blend_id') || blend.id
    const transformed: any = {
      blend_id: id,
      display_name:
        get(blend, 'display_name') || `${blend.name} (${blend.composition})`,
      excluded_usages: blend.excluded_usages,
      group: blend.group,
      row_id: `blend_${id}`,
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

  public transformSubstance(substance: Substance, mandatory?: boolean) {
    const id = get(substance, 'substance_id') || substance.id
    const transformed: any = {
      display_name: get(substance, 'display_name') || substance.name,
      excluded_usages: substance.excluded_usages,
      group: substance.group,
      mandatory: false,
      row_id: `substance_${id}`,
      substance_id: id,
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
    substances: Array<Substance>,
    blends: Array<Blend>,
  ) {
    const substancesById = groupBy(substances, 'id')
    const blendsById = groupBy(blends, 'id')
    const mergedMap = new Map()
    original.forEach((item: any) => mergedMap.set(item[this.key], { ...item }))
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
        window.localStorage.setItem(
          this.localStorageKey,
          JSON.stringify(newData),
        )
      } catch {}
    }
  }
}
