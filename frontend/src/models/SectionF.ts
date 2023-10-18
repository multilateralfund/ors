import { forOwn, get, isNull, isString } from 'lodash'

import { Field } from './Section'

export type SectionFFormFields = {
  remarks?: string
}

export type DeserializedDataE = SectionFFormFields & { [key: string]: any }

export default class SectionF {
  private data: DeserializedDataE = {
    remarks: '',
  }
  private formFields: Record<keyof SectionFFormFields, Field> = {
    remarks: { dataType: 'string', defaultValue: '' },
  }
  public key = 'rowId'
  public localStorageKey: null | string = null

  constructor(localStorageKey: string) {
    this.localStorageKey = localStorageKey

    let localStorageData: DeserializedDataE | string =
      __CLIENT__ && this.localStorageKey
        ? window.localStorage.getItem(this.localStorageKey) || {}
        : {}
    if (isString(localStorageData)) {
      try {
        localStorageData = JSON.parse(localStorageData)
      } catch {}
    }

    forOwn(this.formFields, (field, fieldKey) => {
      this.data[fieldKey] = this.getFormFieldValue(
        field,
        get(localStorageData, fieldKey),
      )
    })
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
    if (isNull(value) || (field.dataType === 'string' && !isString(value))) {
      return field.defaultValue
    }
    return value
  }

  public getSubmitFormData(data: DeserializedDataE) {
    if (!this.formFields) return {}
    const formData: DeserializedDataE = {}

    forOwn(this.formFields, (field: any, fieldKey: any) => {
      formData[fieldKey] = this.getFormFieldValue(field, data[fieldKey])
    })

    if (formData.error) {
      delete formData.error
    }
    return formData
  }

  public updateLocalStorage(newData: DeserializedDataE) {
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
