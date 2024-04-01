import { CPReport } from '@ors/types/api_country-programme_records'
import {
  EmptyReportType,
  EmptyReportUsageColumn,
} from '@ors/types/api_empty-form'
import type { CPReportsSlice, Country } from '@ors/types/store'
import { ReportVariant } from '@ors/types/variants'

import { ColDef } from 'ag-grid-community'
import { produce } from 'immer'
import { filter, map, omit } from 'lodash'
import hash from 'object-hash'

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
  variant: ReportVariant | null,
  view = true,
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
          children: map(children, (usage) => mapUsage(usage, variant, view)),
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
  set,
}: CreateSliceProps): CPReportsSlice => {
  return {
    blends: {
      ...defaultSliceData,
      ...(initialState?.cp_reports?.blends || {}),
    },
    cacheInvalidate: [],
    cacheInvalidateReport: (country_id: number, year: number) => {
      set(
        produce((state) => {
          state.cp_reports.cacheInvalidate = [
            ...state.cp_reports.cacheInvalidate,
            hash({ country_id, year }),
          ]
        }),
      )
    },
    fetchArchivedBundle: async (report_id, view = true) => {
      const {
        fetchArchivedReport,
        fetchEmptyForm,
        fetchVersions,
        setReportCountry,
      } = get().cp_reports
      await fetchArchivedReport(report_id)
      const report = getSlice<CPReport>('cp_reports.report.data')
      setReportCountry(report)
      fetchEmptyForm(report, view)
      if (view) {
        fetchVersions(report.country_id, report.year)
      }
    },
    fetchArchivedReport: async (report_id) => {
      const options = {
        removeCacheTimeout: 60,
        withStoreCache: true,
      }
      const path = `api/country-programme-archive/records/?cp_report_id=${report_id}`

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
    fetchBundle: async (country_id, year, view = true) => {
      const { fetchEmptyForm, fetchReport, fetchVersions, setReportCountry } =
        get().cp_reports
      await fetchReport(country_id, year)
      const report = getSlice<CPReport>('cp_reports.report.data')
      setReportCountry(report)
      fetchEmptyForm(report, view)
      fetchVersions(country_id, year)
    },
    fetchEmptyForm: async (report = null, view = true) => {
      const variant = getVariant(report)
      const options = {
        removeCacheTimeout: 60,
        withStoreCache: true,
      }
      const path = report
        ? `api/country-programme/empty-form/?country_id=${report.country_id}&year=${report.year}`
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
                      mapUsage(usage, variant, view),
                    ),
                  }
                : {}),
              ...(usage_columns.section_b
                ? {
                    section_b: usage_columns.section_b.map((usage) =>
                      mapUsage(usage, variant, view),
                    ),
                  }
                : {}),
            },
          }
        },
        slice: 'cp_reports.report.emptyForm',
      })
    },
    fetchReport: async (country_id, year) => {
      const { cacheInvalidate } = get().cp_reports
      const options = {
        invalidateCache: cacheInvalidate.includes(hash({ country_id, year })),
        removeCacheTimeout: 60,
        withStoreCache: true,
      }
      const path = `api/country-programme/records/?country_id=${country_id}&year=${year}`

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
    fetchVersions: async (country_id, year) => {
      const options = {
        removeCacheTimeout: 60,
        withStoreCache: true,
      }
      const versionsPath = `api/country-programme/versions/?country_id=${country_id}&year=${year}`

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
    setReportCountry: (report) => {
      const countries = getSlice<Country[]>('common.countries_for_listing.data')
      const country = countries.filter(
        (country) => country.id === report.country_id,
      )[0]
      setSlice('cp_reports.report.country', country)
    },
    substances: {
      ...defaultSliceData,
      ...(initialState?.cp_reports?.substances || {}),
    },
  }
}
