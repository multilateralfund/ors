import { forOwn, get, isNull, isObject, isString } from 'lodash'

import { Field } from './Section'

export type SectionFFormFields = {
  remarks?: string
}

export type DeserializedDataF = SectionFFormFields & { [key: string]: any }

export default class SectionF {
  private data: DeserializedDataF = {
    remarks: '',
  }
  private formFields: Record<keyof SectionFFormFields, Field> = {
    remarks: { dataType: 'string', defaultValue: '' },
  }
  public key = 'row_id'
  public localStorageKey: null | string = null

  constructor(
    initialData: DeserializedDataF = {},
    localStorageKey: null | string,
  ) {
    this.localStorageKey = localStorageKey

    let localStorageData: DeserializedDataF | string =
      __CLIENT__ && this.localStorageKey
        ? window.sessionStorage.getItem(this.localStorageKey) || {}
        : {}
    if (isString(localStorageData)) {
      try {
        localStorageData = JSON.parse(localStorageData)
      } catch {}
    }

    forOwn(this.formFields, (field, fieldKey) => {
      this.data[fieldKey] = this.getFormFieldValue(
        field,
        get(
          {
            ...initialData,
            ...(isObject(localStorageData) ? localStorageData : {}),
          },
          fieldKey,
        ),
      )
    })
  }

  public clearLocalStorage() {
    if (this.localStorageKey) {
      window.sessionStorage.removeItem(this.localStorageKey)
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

  public getSubmitFormData(data: DeserializedDataF) {
    if (!this.formFields) return {}
    const formData: DeserializedDataF = {}

    forOwn(this.formFields, (field: any, fieldKey: any) => {
      formData[fieldKey] = this.getFormFieldValue(field, data[fieldKey])
    })

    if (formData.error) {
      delete formData.error
    }
    return formData
  }

  public updateLocalStorage(newData: DeserializedDataF) {
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
