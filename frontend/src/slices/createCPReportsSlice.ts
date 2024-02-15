import type { CPReportsSlice } from '@ors/types/store'

import { filter, isNull, isUndefined, map, omit } from 'lodash'

import { colDefById, defaultColDef } from '@ors/config/Table/columnsDef'

import {
  defaultSliceData,
  fetchSliceData,
  getInitialSliceData,
  getSlice,
  setSlice,
} from '@ors/helpers/Store/Store'
import { CreateSliceProps } from '@ors/store'

function filterUsage(usage: any, report: any) {
  const year = report?.year || new Date().getFullYear()
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

function mapUsage(usage: any, report: any, view = true): any {
  const children = filter(usage.children || [], (usage) =>
    filterUsage(usage, report),
  )

  return {
    id: usage.id,
    category: usage.columnCategory,
    dataType: 'number',
    headerName: usage.headerName,
    initialWidth: defaultColDef.minWidth,
    ...omit(
      colDefById[usage.full_name] || {},
      view ? 'headerComponentParams.footnote' : [],
    ),
    ...(children.length
      ? {
          children: map(children, (usage) => mapUsage(usage, report, view)),
          headerGroupComponent: 'agColumnHeaderGroup',
          marryChildren: true,
        }
      : {
          aggFunc: 'sumTotalUsages',
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
      const report = view ? getSlice('cp_reports.report.data') : null
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
        parseResponse: (response) => {
          const { usage_columns } = response
          return {
            ...(response || {}),
            usage_columns: {
              ...(usage_columns.section_a
                ? {
                    section_a: usage_columns.section_a
                      .filter((usage: any) => filterUsage(usage, report))
                      .map((usage: any) => mapUsage(usage, report, view)),
                  }
                : {}),
              ...(usage_columns.section_b
                ? {
                    section_b: usage_columns.section_b
                      .filter((usage: any) => filterUsage(usage, report))
                      .map((usage: any) => mapUsage(usage, report, view)),
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
