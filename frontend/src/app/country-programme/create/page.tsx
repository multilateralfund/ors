import type { Metadata } from 'next'

import React from 'react'

import { isNull, isUndefined } from 'lodash'

import CPReportCreate from '@ors/components/manage/Blocks/CountryProgramme/CPReportCreate'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import api from '@ors/helpers/Api/Api'

export const metadata: Metadata = {
  title: 'Create report',
}

export default async function CreateReport() {
  const emptyForm =
    (await api('api/country-programme/empty-form/', {}, false)) || {}

  function filterUsage(usage: any) {
    const year = new Date().getFullYear()
    const minYear = isNull(usage.min_year) ? -Infinity : usage.min_year
    const maxYear = isNull(usage.max_year) ? Infinity : usage.max_year
    if (
      (minYear <= year && maxYear >= year) ||
      isUndefined(minYear) ||
      isUndefined(maxYear)
    ) {
      return true
    }
    return false
  }

  function mapUsage(usage: any) {
    const children = usage.children.filter(filterUsage)
    return {
      id: usage.id,
      category: usage.columnCategory,
      cellDataType: 'number',
      headerName: usage.headerName,
      // ...(colDefByUsageId[usage.id] || {}),
      ...(children.length
        ? {
            children: children.map(mapUsage),
            headerGroupComponent: 'agColumnHeaderGroup',
            marryChildren: true,
          }
        : {
            aggFunc: 'sumTotalUsages',
          }),
    }
  }

  return (
    <PageWrapper>
      <CPReportCreate
        emptyForm={{
          ...emptyForm,
          usage_columns: emptyForm.usage_columns
            .filter(filterUsage)
            .map(mapUsage),
        }}
      />
    </PageWrapper>
  )
}
