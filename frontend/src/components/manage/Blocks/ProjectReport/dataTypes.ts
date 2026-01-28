import { DataTypeDefinition } from 'ag-grid-community'
import {
  formatBoolean,
  formatDate,
  formatDecimal,
  formatPercent,
  formatUSD,
  parseDate,
} from '@ors/components/manage/Blocks/ProjectReport/utils.ts'
import { isNil } from 'lodash'
import {
  validateDate,
  validateNumber,
  ValidatorMixin,
} from '@ors/components/manage/Blocks/ProjectReport/AnnualProgressReport/validation.tsx'

export const dataTypeDefinitions: Record<
  string,
  DataTypeDefinition & ValidatorMixin
> = {
  dateString: {
    baseDataType: 'dateString',
    extendsDataType: 'dateString',
    // From date picker to our ISO format (YYYY-MM-DD)
    dateFormatter: (value) => formatDate(value, 'YYYY-MM-DD'),
    // Format value to UI format (DD/MM/YYYY)
    valueFormatter: (params) => formatDate(params.value),
    // Parse to date from ISO format
    dateParser: (value) => parseDate(value),
    validators: [validateDate],
    valueParser: (params) => {
      if (isNil(params.newValue) || params.newValue === '') {
        return null
      }

      return params.newValue
    },
  },
  currency: {
    baseDataType: 'number',
    extendsDataType: 'number',
    valueFormatter: (params) => formatUSD(params.value),
    validators: [validateNumber],
  },
  percent: {
    baseDataType: 'number',
    extendsDataType: 'number',
    valueFormatter: (params) => formatPercent(params.value),
    validators: [validateNumber],
  },
  decimal: {
    baseDataType: 'number',
    extendsDataType: 'number',
    valueFormatter: (params) => formatDecimal(params.value),
    validators: [validateNumber],
  },
  boolean: {
    baseDataType: 'boolean',
    extendsDataType: 'boolean',
    valueFormatter: (params) => formatBoolean(params.value),
  },
}
