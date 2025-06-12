import { filter, find, get, isEqual, isObject, map } from 'lodash'
import { ValueSetterParams } from 'ag-grid-community'

export const agFormatValue = (value: any) => value?.id || ''
export const agFormatNameValue = (value: any) => value?.name || ''
export const agFormatValueTags = (value: any) =>
  value?.length > 0 ? value : ''

export const getOptions = (value: any, options: Array<any>) => {
  const formattedValue = map(value, (val) =>
    isObject(val) ? get(val, 'id') : val,
  )

  return filter(options, (option) => !formattedValue.includes(option.id))
}

export const getOptionLabel = (data: any, option: any, field: string = 'id') =>
  isObject(option)
    ? get(option, 'name')
    : find(data, { [field]: option })?.name || ''

export const isOptionEqualToValue = (option: any, value: any) =>
  isObject(value) ? isEqual(option, value) : option.id === value

export const isOptionEqualToValueByName = (option: any, value: any) =>
  isObject(value) ? isEqual(option, value) : option.name === value

export const isOptionEqualToValueByCode = (option: any, value: any) =>
  isObject(value) ? isEqual(option, value) : option.code === value

export const getClusterTypesOpts = (params: any, clusterOptions: any) =>
  get(
    find(clusterOptions, { cluster_id: params.data?.project_cluster_id }),
    'types',
    [],
  )

export const getTypeSectorsOpts = (params: any, typesOptions: any) =>
  get(
    find(typesOptions, { type_id: params.data?.project_type_id }),
    'sectors',
    [],
  )

export const getSectorSubsectorsOpts = (params: any, sectorOptions: any) =>
  get(find(sectorOptions, { id: params.data?.sector_id }), 'subsectors', [])

const emptySector = (params: ValueSetterParams) => {
  params.data.sector_id = null
  params.data.sector_code = null
  params.data.sector = {}
}

const emptySubsector = (params: ValueSetterParams) => {
  params.data.subsector_id = null
  params.data.subsector = {}
}

const updateProjectType = (params: ValueSetterParams, opts: any) => {
  const projectTypesOpts = getClusterTypesOpts(params, opts)
  const projectTypesOptsIds = map(projectTypesOpts, 'type_id')

  if (!projectTypesOptsIds.includes(params.data?.project_type_id)) {
    params.data.project_type_id = null
    params.data.project_type_code = null
    params.data.project_type = {}

    emptySector(params)
    emptySubsector(params)
  }
}

const updateSector = (params: ValueSetterParams, opts: any) => {
  const projectTypesOpts = getClusterTypesOpts(params, opts)
  const sectorOpts = getTypeSectorsOpts(params, projectTypesOpts)
  const sectorOptsIds = map(sectorOpts, 'sector_id')

  if (!sectorOptsIds.includes(params.data?.sector_id)) {
    emptySector(params)
    emptySubsector(params)
  }
}

const updateSubsector = (params: ValueSetterParams, opts: any) => {
  const subsectorOpts = getSectorSubsectorsOpts(params, opts)
  const subsectorOptsIds = map(subsectorOpts, 'id')

  if (!subsectorOptsIds.includes(params.data?.subsector_id)) {
    params.data.subsector_id = null
    params.data.subsector = {}
  }
}

export const valueSetter = (
  params: ValueSetterParams,
  colIdentifier: string,
  data: any,
  opts?: any,
) => {
  const newVal = params.newValue

  const currentDataObj = find(data, {
    id: newVal,
  })

  params.data[colIdentifier + '_id'] = newVal

  if (['project_type', 'sector'].includes(colIdentifier)) {
    params.data[colIdentifier + '_code'] = currentDataObj?.code || ''
  }

  params.data[colIdentifier] = currentDataObj

  if (colIdentifier === 'project_cluster') {
    updateProjectType(params, opts)
  }
  if (colIdentifier === 'project_type') {
    updateSector(params, opts)
  }
  if (colIdentifier === 'sector') {
    updateSubsector(params, opts)
  }

  return true
}

export const lvcValueSetter = (params: any, colIdentifier: string) => {
  params.data[colIdentifier] = params.newValue

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

  params.data.status = currentDataObj?.id || ''
  params.data.status_display = currentDataObj?.name || ''

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
