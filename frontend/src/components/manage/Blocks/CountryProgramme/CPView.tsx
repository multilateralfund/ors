'use client'
import React, { useEffect, useMemo, useState } from 'react'

import { Tab, Tabs, Tooltip, Typography } from '@mui/material'
import cx from 'classnames'
import { produce } from 'immer'
import { filter, includes } from 'lodash'

import CPComments from '@ors/components/manage/Blocks/CountryProgramme/CPComments'
import Loading from '@ors/components/theme/Loading/Loading'
import Error from '@ors/components/theme/Views/Error'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import Link from '@ors/components/ui/Link/Link'
import SectionOverlay from '@ors/components/ui/SectionOverlay/SectionOverlay'
import { FootnotesProvider } from '@ors/contexts/Footnote/Footnote'
import { formatApiUrl } from '@ors/helpers/Api/utils'
import { defaultSliceData } from '@ors/helpers/Store/Store'
import { variants } from '@ors/slices/createCPReportsSlice'
import { useStore } from '@ors/store'

import { getSections } from '.'
import Portal from '../../Utils/Portal'
import { CPArchiveHeader, CPViewHeader } from './CPHeader'
import CPSectionWrapper from './CPSectionWrapper'
import { ITableProps } from './typesCPView'

import { AiFillFileExcel, AiFillFilePdf } from 'react-icons/ai'
import { IoClose, IoDownloadOutline, IoExpand } from 'react-icons/io5'

const TableProps: ITableProps = {
  Toolbar: ({
    archive,
    enterFullScreen,
    exitFullScreen,
    fullScreen,
    isActiveSection,
    onPrint,
    print,
    report,
    section,
  }: any) => {
    return (
      <div
        className={cx('mb-4 flex', {
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
        {section.note && (
          <Typography
            className={cx(
              'border border-solid border-black px-2 py-4 font-bold',
              {
                'mb-4 md:mb-0': fullScreen,
              },
            )}
          >
            {section.note}
          </Typography>
        )}
        <Portal
          active={isActiveSection && !fullScreen}
          domNode="sectionToolbar"
        >
          <div className="flex items-center justify-end">
            <Dropdown
              className="normal-case hover:bg-transparent"
              color="primary"
              tooltip="Download"
              label={
                <div className="flex items-center justify-between gap-x-2 text-base">
                  <span className="font-medium text-primary">Download</span>
                  <IoDownloadOutline className="text-xl text-secondary" />
                </div>
              }
              icon
            >
              <Dropdown.Item>
                <Link
                  className="flex items-center gap-x-2 text-black no-underline"
                  target="_blank"
                  href={
                    formatApiUrl(
                      `api/country-programme${archive ? '-archive' : ''}/export/`,
                    ) +
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
                    formatApiUrl(
                      `api/country-programme${archive ? '-archive' : ''}/print/`,
                    ) +
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
                <div
                  className="text-md cursor-pointer"
                  aria-label="enter fullscreen"
                  onClick={() => {
                    enterFullScreen()
                  }}
                >
                  <div className="flex items-center justify-between gap-x-2">
                    <span className="text-primary">Fullscreen</span>
                    <IoExpand className="text-xl text-secondary" />
                  </div>
                </div>
              </Tooltip>
            )}
            {fullScreen && (
              <Tooltip placement="top" title="Exit fullscreen">
                <div
                  className="exit-fullscreen not-printable text-md cursor-pointer p-2 text-primary"
                  aria-label="exit fullscreen"
                  onClick={() => {
                    exitFullScreen()
                  }}
                >
                  <div className="flex items-center justify-between gap-x-2">
                    <span className="text-primary">Close</span>
                    <IoClose className="text-xl text-secondary" />
                  </div>
                </div>
              </Tooltip>
            )}
          </div>
        </Portal>
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

  const showComments = variant?.model === 'V' && activeTab !== 0

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
      <div className="flex items-center justify-between">
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
        <div id="sectionToolbar"></div>
      </div>

      <CPSectionWrapper>
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
                className={cx('flex flex-col gap-6 transition', {
                  'absolute -left-[9999px] -top-[9999px] opacity-0':
                    activeTab !== index,
                })}
                aria-labelledby={section.id}
                role="tabpanel"
              >
                <FootnotesProvider>
                  <Section
                    emptyForm={report.emptyForm.data || {}}
                    report={report.data}
                    section={section}
                    variant={variant}
                    TableProps={{
                      ...TableProps,
                      archive,
                      context: { section, variant },
                      isActiveSection: activeTab == index,
                      report,
                      section,
                    }}
                  />
                  {!isSectionChecked && variant?.model === 'V' ? (
                    <SectionOverlay />
                  ) : null}
                </FootnotesProvider>
              </div>
            )
          })}
        {showComments && <CPComments />}
      </CPSectionWrapper>
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
