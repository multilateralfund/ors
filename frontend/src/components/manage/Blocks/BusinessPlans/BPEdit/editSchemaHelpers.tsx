import { find, get, isEqual, isNull, isObject } from 'lodash'

export const agFormatValue = (value: any) => value?.id || ''
export const agFormatNameValue = (value: any) => value?.name || ''
export const agFormatValueTags = (value: any) =>
  value?.length > 0 ? value : ''

export const getOptionLabel = (data: any, option: any) =>
  isObject(option)
    ? get(option, 'name')
    : find(data, { id: option })?.name || ''

export const getOptionLabelByName = (data: any, option: any) =>
  isObject(option)
    ? get(option, 'name')
    : find(data, { name: option })?.name || ''

export const isOptionEqualToValue = (option: any, value: any) =>
  isObject(value) ? isEqual(option, value) : option.id === value

export const isOptionEqualToValueByName = (option: any, value: any) =>
  isObject(value) ? isEqual(option, value) : option.name === value

export const valueSetter = (params: any, colIdentifier: string, data: any) => {
  const newVal = params.newValue

  const currentDataObj = find(data, {
    id: newVal,
  })

  params.data[colIdentifier + '_id'] = newVal

  if (['project_type', 'sector'].includes(colIdentifier)) {
    params.data[colIdentifier + '_code'] = currentDataObj?.code
  }

  params.data[colIdentifier] = currentDataObj

  return true
}

export const substancesValueSetter = (params: any, substances: any) => {
  const newValIds = params.newValue?.map((newVal: any) =>
    isObject(newVal) ? get(newVal, 'id') : newVal,
  )

  params.data.substances = newValIds
  params.data.substances_display = newValIds?.map(
    (id: number) =>
      find(substances, {
        id,
      })?.name,
  )

  return true
}

export const statusValueSetter = (params: any, statuses: any) => {
  const newVal = params.newValue

  const currentDataObj = find(statuses, {
    id: newVal,
  })

  params.data.status = currentDataObj?.id
  params.data.status_display = currentDataObj?.name

  return true
}

export const MYAValueSetter = (params: any, multiYearFilterOptions: any) => {
  const newVal = params.newValue

  const currentDataObj = find(multiYearFilterOptions, {
    name: newVal,
  })

  params.data.is_multi_year_display = currentDataObj?.fullName
  params.data.is_multi_year = currentDataObj?.id

  return true
}

export const commentsValueSetter = (params: any) => {
  const newValNames = params.newValue?.map((newVal: any) =>
    isObject(newVal) ? get(newVal, 'name') : newVal,
  )
  params.data.comment_types = newValNames

  return true
}
