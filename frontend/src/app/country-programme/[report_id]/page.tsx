import type { Metadata } from 'next'

import { isNull, isUndefined } from 'lodash'

import CPReportView from '@ors/components/manage/Blocks/CountryProgramme/CPReportView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import api from '@ors/helpers/Api'

export const metadata: Metadata = {
  title: 'Country programme',
}

type ReportProps = {
  params: {
    report_id: string
  }
}

export default async function CountryProgrammeReport({ params }: ReportProps) {
  const report =
    (await api(
      `api/country-programme/records/?cp_report_id=${params.report_id}`,
      {},
      false,
    )) || {}
  const emptyForm =
    (await api(
      `api/country-programme/empty-form/?cp_report_id=${params.report_id}`,
      {},
      false,
    )) || {}

  function filterUsage(usage: any) {
    const year = report.year
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
          }),
    }
  }

  return (
    <PageWrapper>
      <CPReportView
        report={report}
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
