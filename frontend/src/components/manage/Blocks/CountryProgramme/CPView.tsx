'use client'
import React, { useEffect, useMemo, useState } from 'react'

import { IconButton, Tab, Tabs, Tooltip, Typography } from '@mui/material'
import { AgGridReactProps } from 'ag-grid-react'
import cx from 'classnames'
import { produce } from 'immer'
import { filter, includes } from 'lodash'

import Loading from '@ors/components/theme/Loading/Loading'
import Error from '@ors/components/theme/Views/Error'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import Link from '@ors/components/ui/Link/Link'
import SectionOverlay from '@ors/components/ui/SectionOverlay/SectionOverlay'
import { FootnotesProvider } from '@ors/contexts/Footnote/Footnote'
import { formatApiUrl } from '@ors/helpers/Api/Api'
import { defaultSliceData } from '@ors/helpers/Store/Store'
import { variants } from '@ors/slices/createCPReportsSlice'
import { useStore } from '@ors/store'

import { getSections } from '.'
import { CPArchiveHeader, CPViewHeader } from './CPHeader'
import CPSectionWrapper from './CPSectionWrapper'

import { AiFillFileExcel, AiFillFilePdf } from 'react-icons/ai'
import { IoClose, IoDownloadOutline, IoExpand } from 'react-icons/io5'

export type TableProps = AgGridReactProps & {
  Toolbar?: React.FC<any>
  enableFullScreen?: boolean
  errors?: any
  fadeInOut?: boolean
  headerDepth?: number
  paginationPageSizeSelector?: Array<number>
  rowsVisible?: number
  withFluidEmptyColumn?: boolean
}

const TableProps: TableProps = {
  Toolbar: ({
    enterFullScreen,
    exitFullScreen,
    fullScreen,
    onPrint,
    print,
    report,
    section,
  }: any) => {
    return (
      <div
        className={cx('mb-2 flex', {
          'flex-col': !fullScreen,
          'flex-col-reverse md:flex-row md:items-center md:justify-between md:py-2':
            fullScreen,
          'px-4': fullScreen && !print,
        })}
      >
        <Typography
          className={cx({ 'mb-4 md:mb-0': fullScreen })}
          component="h2"
          variant="h6"
        >
          {section.title}
        </Typography>
        <div className="flex items-center justify-end">
          <Dropdown
            color="primary"
            label={<IoDownloadOutline />}
            tooltip="Download"
            icon
          >
            <Dropdown.Item>
              <Link
                className="flex items-center gap-x-2 text-black no-underline"
                target="_blank"
                href={
                  formatApiUrl('api/country-programme/export/') +
                  '?cp_report_id=' +
                  report.data?.id.toString()
                }
                download
              >
                <AiFillFileExcel className="fill-green-700" size={24} />
                <span>XLSX</span>
              </Link>
            </Dropdown.Item>
            <Dropdown.Item onClick={onPrint}>
              <Link
                className="flex items-center gap-x-2 text-black no-underline"
                target="_blank"
                href={
                  formatApiUrl('api/country-programme/print/') +
                  '?cp_report_id=' +
                  report.data?.id.toString()
                }
                download
              >
                <AiFillFilePdf className="fill-red-700" size={24} />
                <span>PDF</span>
              </Link>
            </Dropdown.Item>
          </Dropdown>
          {section.allowFullScreen && !fullScreen && (
            <Tooltip placement="top" title="Enter fullscreen">
              <IconButton
                color="primary"
                onClick={() => {
                  enterFullScreen()
                }}
              >
                <IoExpand />
              </IconButton>
            </Tooltip>
          )}
          {fullScreen && (
            <Tooltip placement="top" title="Exit fullscreen">
              <IconButton
                className="exit-fullscreen not-printable p-2 text-primary"
                aria-label="exit fullscreen"
                onClick={() => {
                  exitFullScreen()
                }}
              >
                <IoClose size={24} />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </div>
    )
  },
  domLayout: 'autoHeight',
  enableCellChangeFlash: true,
  enableFullScreen: true,
  enablePagination: false,
  noRowsOverlayComponentParams: { label: 'No data reported' },
  rowsVisible: 30,
  suppressCellFocus: false,
  suppressColumnVirtualisation: true,
  suppressLoadingOverlay: true,
  suppressRowHoverHighlight: false,
  withSeparators: false,
}

function CPView(props: { archive?: boolean }) {
  const tabsEl = React.useRef<HTMLDivElement>(null)
  const { archive } = props
  const { report } = useStore((state) => state.cp_reports)
  const { activeTab, setActiveTab } = useStore((state) => state.cp_current_tab)
  const [renderedSections, setRenderedSections] = useState<number[]>([])

  const variant = useMemo(() => {
    if (!report.data) return null
    return filter(variants, (variant) => {
      const year = report.data!.year
      return variant.minYear <= year && variant.maxYear >= year
    })[0]
  }, [report.data])
  const sections = useMemo(
    () => (variant ? getSections(variant, 'view') : []),
    [variant],
  )

  useEffect(() => {
    const indicator = tabsEl.current?.querySelector('.MuiTabs-indicator')

    function handleTransitionEnd() {
      setRenderedSections(
        produce((sections) => {
          if (includes(sections, activeTab)) return
          sections.push(activeTab)
        }),
      )
      if (!indicator) return
      indicator.removeEventListener('transitionend', handleTransitionEnd)
    }

    if (!indicator || renderedSections.length == 0) {
      return handleTransitionEnd()
    }

    indicator.addEventListener('transitionend', handleTransitionEnd)
  }, [activeTab, renderedSections])

  console.log('CPView report', report)

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={
          !report.error &&
          (report.loading || !includes(renderedSections, activeTab))
        }
      />
      {!!report.error && <Error error={report.error} />}
      {archive ? <CPArchiveHeader /> : <CPViewHeader />}
      <Tabs
        className="scrollable"
        aria-label="view country programme report"
        ref={tabsEl}
        scrollButtons="auto"
        value={activeTab}
        variant="scrollable"
        TabIndicatorProps={{
          className: 'h-0',
          style: { transitionDuration: '150ms' },
        }}
        onChange={(event, newValue) => {
          setActiveTab(newValue)
        }}
        allowScrollButtonsMobile
      >
        {sections.map((section) => (
          <Tab
            id={section.id}
            key={section.id}
            className="rounded-b-none px-3 py-2"
            aria-controls={section.panelId}
            label={section.label}
            classes={{
              selected:
                'bg-primary text-mlfs-hlYellow px-3 py-2 rounded-b-none',
            }}
          />
        ))}
      </Tabs>

      {report.emptyForm.loaded &&
        sections.map((section, index) => {
          const isSectionChecked =
            section.id === 'report_info' ||
            // @ts-ignore
            report.data?.report_info?.[`reported_${section.id}`]
          if (!includes(renderedSections, index)) return null
          const Section = section.component
          return (
            <div
              id={section.panelId}
              key={section.panelId}
              className={cx('transition', {
                'absolute -left-[9999px] -top-[9999px] opacity-0':
                  activeTab !== index,
              })}
              aria-labelledby={section.id}
              role="tabpanel"
            >
              <FootnotesProvider>
                <CPSectionWrapper>
                  <Section
                    emptyForm={report.emptyForm.data || {}}
                    report={report.data}
                    section={section}
                    variant={variant}
                    TableProps={{
                      ...TableProps,
                      context: { section, variant },
                      report,
                      section,
                    }}
                  />
                  {!isSectionChecked && variant?.model === 'V' ? (
                    <SectionOverlay />
                  ) : null}
                </CPSectionWrapper>
              </FootnotesProvider>
            </div>
          )
        })}
    </>
  )
}

export default function CPViewWrapper(props: { iso3: string; year: number }) {
  const { iso3, year } = props
  const countries = useStore((state) => state.common.countries_for_listing.data)
  const country = countries.filter((country) => country.iso3 === iso3)[0]

  const { fetchBundle, report, setReport } = useStore(
    (state) => state.cp_reports,
  )

  const dataReady =
    report.data &&
    report.emptyForm.data &&
    report.data.country_id === country.id &&
    report.data.year == year

  useEffect(() => {
    return () => {
      setReport({
        ...defaultSliceData,
        emptyForm: defaultSliceData,
        versions: defaultSliceData,
      })
    }
  }, [setReport])

  useEffect(() => {
    fetchBundle(country.id, year, true)
  }, [country, year, fetchBundle])

  if (!dataReady)
    return (
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={!report.error && report.loading}
      />
    )

  return <CPView />
}

export function CPArchiveViewWrapper({ id }: { id: number }) {
  const { fetchArchivedBundle, report, setReport } = useStore(
    (state) => state.cp_reports,
  )

  const dataReady =
    report.data && report.emptyForm.data && report.data.id === id

  useEffect(() => {
    return () => {
      setReport({
        ...defaultSliceData,
        emptyForm: defaultSliceData,
        versions: defaultSliceData,
      })
    }
  }, [setReport])

  useEffect(() => {
    fetchArchivedBundle(id, true)
  }, [fetchArchivedBundle, id])

  if (!dataReady)
    return (
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={!report.error && report.loading}
      />
    )

  return <CPView archive={true} />
}
