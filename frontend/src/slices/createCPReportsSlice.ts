import { CPReport } from '@ors/types/api_country-programme_records'
import {
  EmptyReportType,
  EmptyReportUsageColumn,
} from '@ors/types/api_empty-form'
import type { CPReportsSlice } from '@ors/types/store'
import { ReportVariant } from '@ors/types/variants'

import { ColDef } from 'ag-grid-community'
import { filter, map, omit } from 'lodash'

import { colDefById, defaultColDef } from '@ors/config/Table/columnsDef'

import {
  defaultSliceData,
  fetchSliceData,
  getInitialSliceData,
  getSlice,
  setSlice,
} from '@ors/helpers/Store/Store'
import { CreateSliceProps } from '@ors/store'

export const variants: ReportVariant[] = [
  {
    maxYear: 2004,
    minYear: 1995,
    model: 'I',
  },
  {
    maxYear: 2011,
    minYear: 2005,
    model: 'II',
  },
  {
    maxYear: 2018,
    minYear: 2012,
    model: 'III',
  },
  {
    maxYear: 2021,
    minYear: 2019,
    model: 'IV',
  },
  {
    maxYear: Infinity,
    minYear: 2022,
    model: 'V',
  },
]

export const getVariant = (report: CPReport | null): ReportVariant | null => {
  let found = null
  if (report) {
    found = filter(
      variants,
      (variant) =>
        variant.minYear <= report.year && variant.maxYear >= report.year,
    )[0]
  }
  return found || null
}

function mapUsage(
  usage: EmptyReportUsageColumn,
  report: CPReport | null,
  view = true,
  variant: ReportVariant | null,
): ColDef {
  const children = usage.children || []
  return {
    id: usage.id,
    category: usage.columnCategory,
    dataType: 'number',
    headerName: usage.headerName,
    initialWidth: defaultColDef.minWidth,
    ...(colDefById[usage.full_name] || {}),
    ...(variant?.model
      ? colDefById[`${usage.full_name} ${variant.model}`] || {}
      : {}),
    ...(children.length
      ? {
          children: map(children, (usage) =>
            mapUsage(usage, report, view, variant),
          ),
          headerGroupComponent: 'agColumnHeaderGroup',
          marryChildren: true,
        }
      : {
          orsAggFunc: 'sumTotalUsages',
          ...(!view
            ? {
                cellEditor: 'agUsageCellEditor',
                field: `usage_${usage.id}`,
              }
            : {}),
        }),
  }
}

export const createCPReportsSlice = ({
  initialState,
  get,
}: CreateSliceProps): CPReportsSlice => {
  return {
    blends: {
      ...defaultSliceData,
      ...(initialState?.cp_reports?.blends || {}),
    },
    fetchBundle: async (id, view = true, archive = false) => {
      const { fetchEmptyForm, fetchReport, fetchVersions } = get().cp_reports
      await fetchReport(id, archive)
      fetchEmptyForm(id, view)
      if (view) {
        fetchVersions(id)
      }
    },
    fetchEmptyForm: async (id, view = true) => {
      const report = view ? getSlice<CPReport>('cp_reports.report.data') : null
      const variant = getVariant(report)
      const options = {
        removeCacheTimeout: 60,
        withStoreCache: true,
      }
      const path = id
        ? `api/country-programme/empty-form/?cp_report_id=${id}`
        : 'api/country-programme/empty-form/'
      return await fetchSliceData({
        apiSettings: {
          options,
          path,
        },
        parseResponse: (response: EmptyReportType) => {
          const { usage_columns } = response

          return {
            ...(response || {}),
            usage_columns: {
              ...(usage_columns.section_a
                ? {
                    section_a: usage_columns.section_a.map((usage) =>
                      mapUsage(usage, report, view, variant),
                    ),
                  }
                : {}),
              ...(usage_columns.section_b
                ? {
                    section_b: usage_columns.section_b.map((usage) =>
                      mapUsage(usage, report, view, variant),
                    ),
                  }
                : {}),
            },
          }
        },
        slice: 'cp_reports.report.emptyForm',
      })
    },
    fetchReport: async (id, archive = false) => {
      const options = {
        removeCacheTimeout: 60,
        withStoreCache: true,
      }
      const path = archive
        ? `api/country-programme-archive/records/?cp_report_id=${id}`
        : `api/country-programme/records/?cp_report_id=${id}`

      return await fetchSliceData({
        apiSettings: {
          options,
          path,
        },
        parseResponse: (response) => ({
          ...(response.cp_report || {}),
          ...omit(response, 'cp_report'),
        }),
        slice: 'cp_reports.report',
      })
    },
    fetchVersions: async (id, archive = false) => {
      const options = {
        removeCacheTimeout: 60,
        withStoreCache: true,
      }
      const versionsPath = archive
        ? `api/country-programme/versions/?cp_report_archive_id=${id}`
        : `api/country-programme/versions/?country_programme_report_id=${id}`

      return await fetchSliceData({
        apiSettings: {
          options,
          path: versionsPath,
        },
        slice: 'cp_reports.report.versions',
      })
    },
    report: {
      ...getInitialSliceData<
        CPReportsSlice['report']['data'],
        CPReportsSlice['report']['error']
      >(),
      emptyForm: getInitialSliceData(),
      versions: getInitialSliceData(),
    },
    setReport: (report) => {
      setSlice('cp_reports.report', report)
    },
    substances: {
      ...defaultSliceData,
      ...(initialState?.cp_reports?.substances || {}),
    },
  }
}
