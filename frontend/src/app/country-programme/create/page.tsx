import type { Metadata } from 'next'

import React from 'react'

import { isNull, isUndefined } from 'lodash'

import CPReportCreate from '@ors/components/manage/Blocks/CountryProgramme/CPReportCreate'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import api from '@ors/helpers/Api'

export const metadata: Metadata = {
  title: 'Create report',
}

export default async function CreateReport() {
  const emptyForm =
    (await api('api/country-programme/empty-form/', {}, false)) || {}

  const substances_a =
    (await api(
      'api/substances/',
      {
        params: {
          displayed_in_latest_format: true,
          section: 'A',
          with_usages: true,
        },
      },
      false,
    )) || []

  const substances_b =
    (await api(
      'api/substances/',
      {
        params: {
          displayed_in_latest_format: true,
          section: 'B',
          with_usages: true,
        },
      },
      false,
    )) || []

  const substances_c =
    (await api(
      'api/substances/',
      {
        params: {
          displayed_in_latest_format: true,
          section: 'C',
          with_usages: true,
        },
      },
      false,
    )) || []

  const blends =
    (await api(
      'api/blends/',
      { params: { displayed_in_latest_format: true, with_usages: true } },
      false,
    )) || []

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
    const children = usage.children?.filter(filterUsage) || []
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
            cellEditor: 'agUsageCellEditor',
            field: `usage_${usage.id}`,
          }),
    }
  }

  return (
    <PageWrapper>
      <CPReportCreate
        blends={blends}
        substances_a={substances_a}
        substances_b={substances_b}
        substances_c={substances_c}
        emptyForm={{
          ...emptyForm,
          ...(emptyForm.usage_columns
            ? {
                usage_columns: {
                  section_a:
                    emptyForm.usage_columns.section_a
                      ?.filter(filterUsage)
                      .map(mapUsage) || [],
                  section_b:
                    emptyForm.usage_columns.section_b
                      ?.filter(filterUsage)
                      .map(mapUsage) || [],
                },
              }
            : {}),
        }}
      />
    </PageWrapper>
  )
}
