'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { IconButton, Tab, Tabs, Typography } from '@mui/material'
import cx from 'classnames'
import { produce } from 'immer'
import {
  filter,
  findIndex,
  get,
  includes,
  isEmpty,
  map,
  pickBy,
  reduce,
  values,
} from 'lodash'

import { defaultColDefEdit } from '@ors/config/Table/columnsDef'

import Loading from '@ors/components/theme/Loading/Loading'
import Error from '@ors/components/theme/Views/Error'
import { FootnotesProvider } from '@ors/contexts/Footnote/Footnote'
import { defaultSliceData } from '@ors/helpers/Store/Store'
import useMakeClassInstance from '@ors/hooks/useMakeClassInstance'
import SectionA from '@ors/models/SectionA'
import SectionB from '@ors/models/SectionB'
import SectionC from '@ors/models/SectionC'
import SectionD from '@ors/models/SectionD'
import SectionE from '@ors/models/SectionE'
import SectionF from '@ors/models/SectionF'
import { variants } from '@ors/slices/createCPReportsSlice'
import { useStore } from '@ors/store'

import { getSections } from '.'
import { CPEditHeader } from './CPHeader'
import CPSectionWrapper from './CPSectionWrapper'

import { IoClose, IoExpand } from 'react-icons/io5'

function defaults(arr: Array<any>, value: any) {
  if (arr?.length > 0) return arr
  return [value]
}

const TableProps = {
  Toolbar: ({ enterFullScreen, exitFullScreen, fullScreen, section }: any) => {
    return (
      <div
        className={cx('mb-2 flex', {
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
        <div className="flex items-center justify-end">
          {/* {!fullScreen && (
            <Dropdown color="primary" label={<IoDownloadOutline />} icon>
              <Dropdown.Item>
                <div className="flex items-center gap-x-2">
                  <AiFillFilePdf className="fill-red-700" size={24} />
                  <span>PDF</span>
                </div>
              </Dropdown.Item>
            </Dropdown>
          )} */}
          {section.allowFullScreen && !fullScreen && (
            <IconButton
              color="primary"
              onClick={() => {
                enterFullScreen()
              }}
            >
              <IoExpand />
            </IconButton>
          )}
          {fullScreen && (
            <div>
              <IconButton
                className="exit-fullscreen not-printable p-2 text-primary"
                aria-label="exit fullscreen"
                onClick={() => {
                  exitFullScreen()
                }}
              >
                <IoClose size={32} />
              </IconButton>
            </div>
          )}
        </div>
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
      report.emptyForm.data.substance_rows.section_a?.filter(
        (item) => item.substance_id,
      ) || [],
      null,
    ]),
    section_b: useMakeClassInstance<SectionB>(SectionB, [
      report.data?.section_b,
      report.emptyForm.data.substance_rows.section_b?.filter(
        (item) => item.substance_id,
      ) || [],
      report.emptyForm.data.substance_rows.section_b?.filter(
        (item) => item.blend_id,
      ),
      null,
    ]),
    section_c: useMakeClassInstance<SectionC>(SectionC, [
      report.data?.section_c,
      report.emptyForm.data.substance_rows.section_c?.filter(
        (item) => item.substance_id,
      ) || [],
      report.emptyForm.data.substance_rows.section_c?.filter(
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

  const [errors, setErrors] = useState<Record<string, any>>({})
  const [form, setForm] = useState<Record<string, any>>({
    adm_b: report.data?.adm_b,
    adm_c: report.data?.adm_c,
    adm_d: report.data?.adm_d,
    section_a: Sections.section_a.getData(),
    section_b: Sections.section_b.getData(),
    section_c: Sections.section_c.getData(),
    section_d: Sections.section_d.getData(),
    section_e: Sections.section_e.getData(),
    section_f: Sections.section_f.getData(),
  })
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
        section_a: Sections.section_a.getSubmitFormData(form.section_a),
        section_b: Sections.section_b.getSubmitFormData(form.section_b),
        section_c: Sections.section_c.getSubmitFormData(form.section_c),
        section_d: Sections.section_d.getSubmitFormData(form.section_d),
        section_e: Sections.section_e.getSubmitFormData(form.section_e),
        section_f: Sections.section_f.getSubmitFormData(form.section_f),
      },
      (value, key) => {
        return findIndex(sections, (section) => key === section.id) > -1
      },
    )
    /* eslint-disable-next-line */
  }, [form])

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
  }, [activeTab])

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
      <CPEditHeader
        getSubmitFormData={getSubmitFormData}
        setErrors={setErrors}
      />
      <form className="create-submission-form">
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
          {sections.map((section) => (
            <Tab
              key={section.id}
              className={cx('rounded-b-none px-3 py-2', {
                'MuiTab-error': !isEmpty(errors?.[section.id]),
              })}
              aria-controls={section.panelId}
              label={section.label}
              classes={{
                selected:
                  'bg-primary text-mlfs-hlYellow px-3 py-2 rounded-b-none',
              }}
            />
          ))}
        </Tabs>
        {!!report.data &&
          sections.map((section, index) => {
            if (!includes(renderedSections, index)) return null
            const Section: React.FC<any> = section.component
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
                      Section={get(Sections, section.id)}
                      emptyForm={report.emptyForm.data || {}}
                      errors={errors}
                      form={form}
                      report={report.data}
                      section={section}
                      setForm={setForm}
                      variant={variant}
                      TableProps={{
                        ...TableProps,
                        context: { section, variant },
                        errors: errors[section.id],
                        report,
                        section,
                      }}
                    />
                  </CPSectionWrapper>
                </FootnotesProvider>
              </div>
            )
          })}
      </form>
    </>
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
