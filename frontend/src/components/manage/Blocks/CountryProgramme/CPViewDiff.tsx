'use client'
import React, { useEffect, useMemo, useState } from 'react'

import { Tab, Tabs, Tooltip, Typography } from '@mui/material'
import cx from 'classnames'
import { produce } from 'immer'
import { includes } from 'lodash'

import UnitSelectionWidget from '@ors/components/manage/Widgets/UnitSelectionWidget'
import Loading from '@ors/components/theme/Loading/Loading'
import Error from '@ors/components/theme/Views/Error'
import SectionOverlay from '@ors/components/ui/SectionOverlay/SectionOverlay'
import { FootnotesProvider } from '@ors/contexts/Footnote/Footnote'
//import { defaultSliceData } from '@ors/helpers/Store/Store'
import { useStore } from '@ors/store'

import { getSections } from '.'
import Portal from '../../Utils/Portal'
import { CPDiffHeader } from './CPHeader'
import CPSectionWrapper from './CPSectionWrapper'
import { ITableProps } from './typesCPView'

import { IoClose, IoExpand } from 'react-icons/io5'

const TableProps: ITableProps = {
  Toolbar: ({
    enterFullScreen,
    exitFullScreen,
    fullScreen,
    gridContext,
    isActiveSection,
    onUnitSelectionChange,
    print,
    section,
  }: any) => {
    // [refs #24639] remove (METRIC TONNES) as we use <UnitSelectionWidget />
    const sectionTitle = section.title
      .split(/\((\w+\s)?METRIC TONNES\)/)[0]
      .trim()
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
          className={cx('flex items-center', { 'mb-4 md:mb-0': fullScreen })}
          component="h2"
          variant="h6"
        >
          {sectionTitle}
          {['section_a', 'section_b'].includes(section.id) ? (
            <UnitSelectionWidget
              className="ml-2 border-y-0 border-l border-r-0 border-solid border-primary pl-2"
              gridContext={gridContext}
              onChange={onUnitSelectionChange}
            />
          ) : null}
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

function CPDiffView() {
  const tabsEl = React.useRef<HTMLDivElement>(null)
  const { report, reportDiff } = useStore((state) => state.cp_reports)
  const { activeTab, setActiveTab } = useStore((state) => state.cp_current_tab)
  const [renderedSections, setRenderedSections] = useState<number[]>([])
  const [unit, setUnit] = useState('mt')

  function handleUnitSelectionChange(option: any) {
    setUnit(option.value)
  }

  const variant = useMemo(() => report.variant, [report])

  const sections = useMemo(
    () => (variant ? getSections(variant, 'diff') : []),
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

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={
          !report.error &&
          !reportDiff.error &&
          (report.loading || !includes(renderedSections, activeTab)) &&
          (reportDiff.loading)
        }
      />
      {!!reportDiff.error && <Error error={reportDiff.error} />}
      <CPDiffHeader />
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
                    report={reportDiff.data}
                    section={section}
                    variant={variant}
                    TableProps={{
                      ...TableProps,
                      context: { section, unit, variant },
                      handleUnitSelectionChange,
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
      </CPSectionWrapper>
    </>
  )
}

export default function CPDiffViewWrapper(props: { iso3: string; year: number }) {
  const { iso3, year } = props
  const countries = useStore((state) => state.common.countries_for_listing.data)
  const country = countries.filter((country) => country.iso3 === iso3)[0]

  const { fetchDiffBundle, report, reportDiff } = useStore(
    (state) => state.cp_reports,
  )

  const dataReady =
    report.data &&
    report.emptyForm.data &&
    report.data.country_id === country.id &&
    report.data.year == year &&
    reportDiff.data

  useEffect(() => {
    fetchDiffBundle(country.id, year)
  }, [country, year, fetchDiffBundle])

  if (!dataReady)
    return (
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={!report.error && report.loading}
      />
    )

  return <CPDiffView />
}
