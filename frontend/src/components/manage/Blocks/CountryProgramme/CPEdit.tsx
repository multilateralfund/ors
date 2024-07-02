'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Tabs, Typography } from '@mui/material'
import cx from 'classnames'
import { produce } from 'immer'
import { findIndex, get, includes, map, pickBy, reduce, values } from 'lodash'

import { defaultColDefEdit } from '@ors/config/Table/columnsDef'

import CPComments from '@ors/components/manage/Blocks/CountryProgramme/CPComments'
import SectionReportedSelect from '@ors/components/manage/Blocks/Section/SectionReportedSelect'
import Loading from '@ors/components/theme/Loading/Loading'
import Error from '@ors/components/theme/Views/Error'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import SectionOverlay from '@ors/components/ui/SectionOverlay/SectionOverlay'
import SectionTab from '@ors/components/ui/SectionTab/SectionTab'
import { FootnotesProvider } from '@ors/contexts/Footnote/Footnote'
import ValidationProvider from '@ors/contexts/Validation/ValidationProvider'
import { defaultSliceData } from '@ors/helpers/Store/Store'
import useMakeClassInstance from '@ors/hooks/useMakeClassInstance'
import SectionA from '@ors/models/SectionA'
import SectionB from '@ors/models/SectionB'
import SectionC from '@ors/models/SectionC'
import SectionD from '@ors/models/SectionD'
import SectionE from '@ors/models/SectionE'
import SectionF from '@ors/models/SectionF'
import { useStore } from '@ors/store'

import { getSections } from '.'
import Portal from '../../Utils/Portal'
import { CPEditHeader } from './CPHeader'
import CPSectionWrapper from './CPSectionWrapper'
import { CPBaseForm } from './typesCPCreate'

import { IoClose, IoExpand } from 'react-icons/io5'

function defaults(arr: Array<any>, value: any) {
  if (arr?.length > 0) return arr
  return [value]
}

const TableProps = {
  Toolbar: ({
    enterFullScreen,
    exitFullScreen,
    fullScreen,
    isActiveSection,
    section,
  }: any) => {
    return (
      <div
        className={cx('mb-4 flex', {
          'flex-col': !fullScreen,
          'flex-col-reverse md:flex-row md:items-center md:justify-between md:py-2':
            fullScreen,
          'px-4': fullScreen,
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
            {section.allowFullScreen && !fullScreen && (
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
            )}
            {fullScreen && (
              <div>
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
              </div>
            )}
          </div>
        </Portal>
      </div>
    )
  },
  defaultColDef: defaultColDefEdit,
  domLayout: 'autoHeight',
  enableCellChangeFlash: true,
  enableFullScreen: true,
  enablePagination: false,
  getRowId: (props: any) => {
    return props.data.row_id
  },
  noRowsOverlayComponentParams: { label: 'No data reported' },
  rowsVisible: 30,
  suppressCellFocus: false,
  suppressColumnVirtualisation: true,
  suppressLoadingOverlay: true,
  suppressRowHoverHighlight: false,
  withSeparators: false,
}

function CPEdit() {
  const tabsEl = React.useRef<HTMLDivElement>(null)
  const { report } = useStore((state) => state.cp_reports)

  const Sections = {
    section_a: useMakeClassInstance<SectionA>(SectionA, [
      report.data?.section_a,
      report.emptyForm.data?.substance_rows?.section_a?.filter(
        (item) => item.substance_id,
      ) || [],
      null,
    ]),
    section_b: useMakeClassInstance<SectionB>(SectionB, [
      report.data?.section_b,
      report.emptyForm.data?.substance_rows?.section_b?.filter(
        (item) => item.substance_id,
      ) || [],
      report.emptyForm.data?.substance_rows?.section_b?.filter(
        (item) => item.blend_id,
      ),
      null,
    ]),
    section_c: useMakeClassInstance<SectionC>(SectionC, [
      report.data?.section_c,
      report.emptyForm.data?.substance_rows?.section_c?.filter(
        (item) => item.substance_id,
      ) || [],
      report.emptyForm.data?.substance_rows?.section_c?.filter(
        (item) => item.blend_id,
      ) || [],
      null,
    ]),
    section_d: useMakeClassInstance<SectionD>(SectionD, [
      defaults(report.data?.section_d || [], {
        all_uses: '0.000',
        chemical_name: 'HFC-23',
        destruction: '0.000',
        display_name: 'HFC-23',
        feedstock: '0.000',
        row_id: 'generation_1',
      }),
      null,
    ]),
    section_e: useMakeClassInstance<SectionE>(SectionE, [
      report.data?.section_e,
      null,
    ]),
    section_f: useMakeClassInstance<SectionF>(SectionF, [
      report.data?.section_f,
      null,
    ]),
  }

  const variant = useMemo(() => report.variant, [report])

  const [errors, setErrors] = useState<Record<string, any>>({})
  const [form, setForm] = useState<Record<string, any>>({
    adm_b: report.data?.adm_b,
    adm_c: report.data?.adm_c,
    adm_d: report.data?.adm_d,
    files: [],
    report_info: {
      reported_section_a: report.data?.report_info?.reported_section_a ?? true,
      reported_section_b: report.data?.report_info?.reported_section_b ?? true,
      reported_section_c: report.data?.report_info?.reported_section_c ?? true,
      reported_section_d: report.data?.report_info?.reported_section_d ?? true,
      reported_section_e: report.data?.report_info?.reported_section_e ?? true,
      reported_section_f: report.data?.report_info?.reported_section_f ?? true,
      reporting_email: report.data?.report_info?.reporting_email || null,
      reporting_entry: report.data?.report_info?.reporting_entry || null,
    },
    section_a: includes(['V'], variant?.model)
      ? Sections.section_a
          .getData()
          .filter((row) => row.id !== 0)
          .map((row) => ({ ...row, mandatory: false }))
      : Sections.section_a.getData(),
    section_b: includes(['V'], variant?.model)
      ? Sections.section_b
          .getData()
          .filter((row) => row.id !== 0)
          .map((row) => ({ ...row, mandatory: false }))
      : Sections.section_b.getData(),
    section_c: includes(['V'], variant?.model)
      ? Sections.section_c
          .getData()
          .filter((row) => row.id !== 0)
          .map((row) => ({ ...row, mandatory: false }))
      : Sections.section_c.getData(),
    section_d: Sections.section_d.getData(),
    section_e: Sections.section_e.getData(),
    section_f: Sections.section_f.getData(),
  })
  const { activeTab, setActiveTab } = useStore((state) => state.cp_current_tab)
  const [renderedSections, setRenderedSections] = useState<number[]>([])

  const sections = useMemo(
    () => (variant ? getSections(variant, 'edit') : []),
    [variant],
  )

  const getSubmitFormData = useCallback(() => {
    return pickBy(
      {
        ...form,
        adm_b: reduce(
          form.adm_b,
          (rows: any, row: any) => {
            map(row.values, (value) => {
              rows.push({
                ...row,
                ...value,
              })
            })
            return rows
          },
          [],
        ),
        adm_c: reduce(
          form.adm_c,
          (rows: any, row: any) => {
            map(row.values, (value) => {
              rows.push({
                ...row,
                ...value,
              })
            })
            return rows
          },
          [],
        ),
        adm_d: values(form.adm_d),
        files: form.files,
        report_info: form.report_info,
        section_a: Sections.section_a.getSubmitFormData(form.section_a),
        section_b: Sections.section_b.getSubmitFormData(form.section_b),
        section_c: Sections.section_c.getSubmitFormData(form.section_c),
        section_d: Sections.section_d.getSubmitFormData(form.section_d),
        section_e: Sections.section_e.getSubmitFormData(form.section_e),
        section_f: Sections.section_f.getSubmitFormData(form.section_f),
      },
      (value, key) => {
        return (
          key === 'files' ||
          findIndex(sections, (section) => key === section.id) > -1
        )
      },
    )
    /* eslint-disable-next-line */
  }, [form])

  const [sectionsChecked, setSectionsChecked] = useState({
    reported_section_a: report.data?.report_info?.reported_section_a ?? true,
    reported_section_b: report.data?.report_info?.reported_section_b ?? true,
    reported_section_c: report.data?.report_info?.reported_section_c ?? true,
    reported_section_d: report.data?.report_info?.reported_section_d ?? true,
    reported_section_e: report.data?.report_info?.reported_section_e ?? true,
    reported_section_f: report.data?.report_info?.reported_section_f ?? true,
  })
  const onSectionCheckChange = (section: string, isChecked: boolean) => {
    setSectionsChecked((prevState: any) => ({
      ...prevState,
      [section]: isChecked,
    }))

    setForm((prevState: any) => ({
      ...prevState,
      report_info: {
        ...prevState.report_info,
        [section]: isChecked,
      },
    }))
  }

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
  }, [renderedSections.length, activeTab])

  const showComments = variant?.model === 'V'

  return (
    <ValidationProvider form={form as CPBaseForm} model={variant?.model}>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={
          !report.error &&
          (report.loading || !includes(renderedSections, activeTab))
        }
      />
      {!!report.error && <Error error={report.error} />}
      <CPEditHeader
        getSubmitFormData={getSubmitFormData}
        setErrors={setErrors}
      />
      <form className="create-submission-form">
        <div className="flex items-center justify-between">
          <Tabs
            className="scrollable"
            aria-label="create submission sections"
            ref={tabsEl}
            scrollButtons="auto"
            value={activeTab}
            variant="scrollable"
            TabIndicatorProps={{
              className: 'h-0',
              style: { transitionDuration: '150ms' },
            }}
            onChange={(event: React.SyntheticEvent, index: number) => {
              setActiveTab(index)
            }}
            allowScrollButtonsMobile
          >
            {sections.map((section, tabIndex) => (
              <SectionTab
                key={section.id}
                errors={errors}
                isActive={activeTab === tabIndex}
                section={section}
              />
            ))}
          </Tabs>
          <div id="sectionToolbar"></div>
        </div>
        <CPSectionWrapper>
          {!!report.data &&
            sections.map((section, index) => {
              if (!includes(renderedSections, index)) return null
              const sectionName = `reported_${section.id}`
              const isSectionChecked: boolean =
                section.id === 'report_info' ||
                // @ts-ignore
                sectionsChecked[sectionName] ||
                false
              const showSectionSelect =
                variant?.model === 'V' && section.id !== 'report_info'
              const Section: React.FC<any> = section.component
              return (
                <div
                  id={section.panelId}
                  key={section.panelId}
                  className={cx('flex flex-col gap-6', {
                    hidden: activeTab !== index,
                  })}
                  aria-labelledby={section.id}
                  role="tabpanel"
                >
                  {showSectionSelect && (
                    <SectionReportedSelect
                      isSectionChecked={isSectionChecked}
                      sectionName={sectionName}
                      onSectionCheckChange={onSectionCheckChange}
                    />
                  )}
                  <div className="relative flex flex-col gap-6">
                    <FootnotesProvider>
                      <Section
                        Comments={CPComments}
                        Section={get(Sections, section.id)}
                        emptyForm={report.emptyForm.data || {}}
                        errors={errors}
                        form={form}
                        isEdit={true}
                        report={report.data}
                        section={section}
                        sectionsChecked={sectionsChecked}
                        setForm={setForm}
                        showComments={showComments}
                        variant={variant}
                        TableProps={{
                          ...TableProps,
                          context: {
                            section,
                            variant,
                            year: report.data?.year,
                          },
                          errors: errors[section.id],
                          isActiveSection: activeTab == index,
                          report,
                          section,
                        }}
                        onSectionCheckChange={onSectionCheckChange}
                      />
                      {!isSectionChecked && variant?.model === 'V' ? (
                        <SectionOverlay />
                      ) : null}
                    </FootnotesProvider>
                  </div>
                </div>
              )
            })}
        </CPSectionWrapper>
      </form>
    </ValidationProvider>
  )
}

export default function CPEditWrapper(props: { iso3: string; year: number }) {
  const { iso3, year } = props
  const countries = useStore((state) => state.common.countries_for_listing.data)
  const country = countries.filter((country) => country.iso3 === iso3)[0]

  const { blends, fetchBundle, report, setReport, substances } = useStore(
    (state) => state.cp_reports,
  )

  const dataReady =
    report.data &&
    report.emptyForm.data &&
    blends.data &&
    substances.data &&
    report.data.country_id === country.id &&
    report.data.year === year

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
    fetchBundle(country.id, year, false)
  }, [country, year, fetchBundle])

  if (report.error) {
    return (
      <div>
        <PageHeading>
          {report.error._info.status} - {report.error._info.statusText}
        </PageHeading>
        <p>{report.error.error}</p>
      </div>
    )
  }

  if (!dataReady) {
    return (
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={!report.error && report.loading}
      />
    )
  }

  return <CPEdit />
}
