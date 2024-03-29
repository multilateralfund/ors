'use client'

import type { TableProps } from '@ors/components/manage/Form/Table'
import { Country } from '@ors/types/store'
import { ReportVariant } from '@ors/types/variants'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import {
  Alert,
  Box,
  Button,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material'
import cx from 'classnames'
import { produce } from 'immer'
import { filter, get, includes, isEmpty } from 'lodash'
import { useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'

import { defaultColDefEdit } from '@ors/config/Table/columnsDef'

import Field from '@ors/components/manage/Form/Field'
import Portal from '@ors/components/manage/Utils/Portal'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import Link from '@ors/components/ui/Link/Link'
import { FootnotesProvider } from '@ors/contexts/Footnote/Footnote'
import api, { getResults } from '@ors/helpers/Api/Api'
import { defaultSliceData } from '@ors/helpers/Store/Store'
import useApi from '@ors/hooks/useApi'
import useMakeClassInstance from '@ors/hooks/useMakeClassInstance'
import SectionA from '@ors/models/SectionA'
import SectionB from '@ors/models/SectionB'
import SectionC from '@ors/models/SectionC'
import SectionD from '@ors/models/SectionD'
import SectionE from '@ors/models/SectionE'
import SectionF from '@ors/models/SectionF'
import { variants } from '@ors/slices/createCPReportsSlice'
import { useStore } from '@ors/store'

import { SectionMeta, getSections } from '.'

import { IoClose, IoExpand, IoLink } from 'react-icons/io5'

type ToolbarProps = {
  enterFullScreen: () => void
  exitFullScreen: () => void
  fullScreen: boolean
  section: SectionMeta
}

interface WidgetCountry {
  id: number
  label: string
}

type FormError = Record<string, string>
type FormErrors = Record<string, FormError>

interface CPCreateTableProps extends TableProps {
  Toolbar: React.FC<ToolbarProps>
  enableCellChangeFlash: boolean
  enableFullScreen: boolean
  enablePagination: boolean
  // getRowId: (props: any) => string
  rowsVisible: number
  suppressCellFocus: boolean
  suppressColumnVirtualisation: boolean
  suppressLoadingOverlay: boolean
  suppressRowHoverHighlight: boolean
  withSeparators: boolean
}

export interface PassedCPCreateTableProps extends CPCreateTableProps {
  context: {
    section:
      | SectionA['data']
      | SectionB['data']
      | SectionC['data']
      | SectionD['data']
      | SectionE['data']
      | SectionF['data']
    variant: ReportVariant
  }
  errors: FormErrors
  report: Report
  section:
    | SectionA['data']
    | SectionB['data']
    | SectionC['data']
    | SectionD['data']
    | SectionE['data']
    | SectionF['data']
}

export interface CPBaseForm {
  country: WidgetCountry | null
  section_a: SectionA['data']
  section_b: SectionB['data']
  section_c: SectionC['data']
  section_d: SectionD['data']
  section_e: SectionE['data']
  section_f: SectionF['data']
  year: number
}

const TableProps: CPCreateTableProps = {
  Toolbar: ({ enterFullScreen, exitFullScreen, fullScreen, section }) => {
    useEffect(() => {
      const listener = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') {
          exitFullScreen()
        }
      }
      window.addEventListener('keydown', listener)
      return () => {
        window.removeEventListener('keydown', listener)
      }
    }, [fullScreen, exitFullScreen])

    return (
      <div
        className={cx(
          'mb-2 flex md:flex-row md:items-center md:justify-between md:py-2',
          {
            'flex-col': !fullScreen,
            'flex-col-reverse': fullScreen,
            'px-4': fullScreen,
          },
        )}
      >
        <div className="flex flex-col">
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
        </div>
        <div className="flex items-center justify-end">
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
  getRowId: (props) => {
    return props.data.row_id
  },
  noRowsOverlayComponentParams: { label: 'No data reported' },
  rowsVisible: 30,
  suppressCellFocus: false,
  suppressColumnVirtualisation: true,
  suppressLoadingOverlay: true,
  suppressRowHoverHighlight: false,
  withSeparators: true,
}

const CPCreate: React.FC = () => {
  const tabsEl = React.useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const { report } = useStore((state) => state.cp_reports)
  const all_countries = useStore(
    (state) => state.common.countries_for_listing.data,
  )
  const [currentCountry, setCurrentCountry] = useState<Country | null>(null)

  const countries: WidgetCountry[] = useStore((state) => [
    ...getResults(state.common.countries_for_create.data).results.map(
      (country) => ({
        id: country.id,
        label: country.name,
      }),
    ),
  ])

  const Sections = {
    section_a: useMakeClassInstance<SectionA>(SectionA, [
      [],
      report.emptyForm.data.substance_rows.section_a?.filter(
        (item) => item.substance_id,
      ) || [],
      'section_a_create',
    ]),
    section_b: useMakeClassInstance<SectionB>(SectionB, [
      [],
      report.emptyForm.data.substance_rows.section_b?.filter(
        (item) => item.substance_id,
      ) || [],
      report.emptyForm.data.substance_rows.section_b?.filter(
        (item) => item.blend_id,
      ) || [],
      'section_b_create',
    ]),
    section_c: useMakeClassInstance<SectionC>(SectionC, [
      [],
      report.emptyForm.data.substance_rows.section_c?.filter(
        (item) => item.substance_id,
      ) || [],
      report.emptyForm.data.substance_rows.section_c?.filter(
        (item) => item.blend_id,
      ) || [],
      'section_c_create',
    ]),
    section_d: useMakeClassInstance<SectionD>(SectionD, [
      [
        {
          all_uses: '0.000',
          chemical_name: 'HFC-23',
          destruction: '0.000',
          display_name: 'HFC-23',
          feedstock: '0.000',
          row_id: 'generation_1',
        },
      ],
      'section_d_create',
    ]),
    section_e: useMakeClassInstance<SectionE>(SectionE, [
      [],
      'section_e_create',
    ]),
    section_f: useMakeClassInstance<SectionF>(SectionF, [
      {},
      'section_f_create',
    ]),
  }

  const [errors, setErrors] = useState<FormErrors>({})
  const [currentYear] = useState(new Date().getFullYear() - 1)
  const [form, setForm] = useState<CPBaseForm>({
    country: null,
    section_a: Sections.section_a.getData(),
    section_b: Sections.section_b.getData(),
    section_c: Sections.section_c.getData(),
    section_d: Sections.section_d.getData(),
    section_e: Sections.section_e.getData(),
    section_f: Sections.section_f.getData(),
    year: currentYear,
  })
  const [activeTab, setActiveTab] = useState(0)
  const [renderedSections, setRenderedSections] = useState<number[]>([])

  const existingReports = useApi({
    options: {
      triggerIf: !!form.country?.id,
    },
    path: `/api/country-programme/reports/?year_max=${currentYear}&year_min=${currentYear}&country_id=${form.country?.id}`,
  })

  const [variant] = useState(() => {
    return filter(variants, (variant) => {
      return variant.minYear <= currentYear && variant.maxYear >= currentYear
    })[0]
  })
  const sections = useMemo(
    () => (variant ? getSections(variant, 'edit') : []),
    [variant],
  )

  const getSubmitFormData = useCallback(() => {
    return {
      ...form,
      country_id: form.country?.id,
      name: form.country?.label ? `${form.country?.label} ${form.year}` : '',
      section_a: Sections.section_a.getSubmitFormData(form.section_a),
      section_b: Sections.section_b.getSubmitFormData(form.section_b),
      section_c: Sections.section_c.getSubmitFormData(form.section_c),
      section_d: Sections.section_d.getSubmitFormData(form.section_d),
      section_e: Sections.section_e.getSubmitFormData(form.section_e),
      section_f: Sections.section_f.getSubmitFormData(form.section_f),
    }
    /* eslint-disable-next-line */
  }, [form])

  useEffect(() => {
    existingReports.setApiSettings({
      options: {
        ...existingReports.apiSettings.options,
        triggerIf: !!form.country?.id,
      },
      path: `/api/country-programme/reports/?year_max=${currentYear}&year_min=${currentYear}&country_id=${form.country?.id}`,
    })
    // eslint-disable-next-line
  }, [form.country])

  useEffect(() => {
    Sections.section_a.updateLocalStorage(form.section_a)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.section_a])

  useEffect(() => {
    Sections.section_b.updateLocalStorage(form.section_b)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.section_b])

  useEffect(() => {
    Sections.section_c.updateLocalStorage(form.section_c)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.section_c])

  useEffect(() => {
    Sections.section_d.updateLocalStorage(form.section_d)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.section_d])

  useEffect(() => {
    Sections.section_e.updateLocalStorage(form.section_e)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.section_e])

  useEffect(() => {
    Sections.section_f.updateLocalStorage(form.section_f)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.section_f])

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
      <HeaderTitle>
        <div className="mb-4 min-h-[40px]">
          <Typography component="h1" variant="h3">
            New submission - {currentYear}
          </Typography>
        </div>
      </HeaderTitle>
      <form className="create-submission-form">
        <Tabs
          className="scrollable mb-4"
          aria-label="create submission sections"
          ref={tabsEl}
          scrollButtons="auto"
          value={activeTab}
          variant="scrollable"
          TabIndicatorProps={{
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
              className={cx({ 'MuiTab-error': !isEmpty(errors?.[section.id]) })}
              aria-controls={section.panelId}
              label={section.label}
            />
          ))}
        </Tabs>
        <div className="mb-4 grid grid-cols-1 gap-x-4 md:grid-cols-2 lg:grid-cols-3">
          <Field
            id="country"
            name="country_id"
            FieldProps={{ className: 'mb-0' }}
            disabled={existingReports.loading}
            options={countries}
            value={form.country}
            widget="autocomplete"
            Input={{
              error: !!errors.country_id,
              helperText: errors.country_id?.general_error,
              label: 'Country',
            }}
            onChange={(_event, value) => {
              const country = value as WidgetCountry
              setForm({ ...form, country })
              setCurrentCountry(
                all_countries.filter((c) => c.id == country.id)[0],
              )
            }}
          />
          {!!existingReports.data?.length && currentCountry && (
            <div className="flex items-center">
              <Tooltip
                placement="top"
                title={`There is already a submission for ${existingReports.data[0].name}. Click on this icon to view the submission.`}
              >
                <Typography className="inline-flex items-center">
                  <Link
                    className="inline-block"
                    href={`/country-programme/${currentCountry.iso3}/${form.year}`}
                  >
                    <IoLink size={24} />
                  </Link>
                </Typography>
              </Tooltip>
            </div>
          )}
        </div>
        {!!Object.keys(errors).length && (
          <Alert className="mb-4" severity="error">
            <Typography>
              Please make sure a country is selected and all the sections are
              valid.
            </Typography>
          </Alert>
        )}
        {sections.map((section, index) => {
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
              </FootnotesProvider>
            </div>
          )
        })}
        <Portal domNode="bottom-control">
          <Box className="rounded-none border-0 border-t px-4">
            <div className="container flex w-full justify-between">
              <Link
                color="secondary"
                href="/country-programme"
                size="small"
                variant="contained"
                onClick={() => {
                  Sections.section_a.clearLocalStorage()
                  Sections.section_b.clearLocalStorage()
                  Sections.section_c.clearLocalStorage()
                  Sections.section_d.clearLocalStorage()
                  Sections.section_e.clearLocalStorage()
                  Sections.section_f.clearLocalStorage()
                }}
                button
              >
                Close
              </Link>
              <Button
                color="primary"
                size="small"
                variant="contained"
                disabled={
                  !!existingReports.data?.length || existingReports.loading
                }
                onClick={async () => {
                  try {
                    await api('api/country-programme/reports/', {
                      data: getSubmitFormData(),
                      method: 'POST',
                    })
                    setErrors({})
                    Sections.section_a.clearLocalStorage()
                    Sections.section_b.clearLocalStorage()
                    Sections.section_c.clearLocalStorage()
                    Sections.section_d.clearLocalStorage()
                    Sections.section_e.clearLocalStorage()
                    Sections.section_f.clearLocalStorage()
                    enqueueSnackbar(
                      <>
                        Added new submission for {form.country!.label}{' '}
                        {form.year}.
                      </>,
                      { variant: 'success' },
                    )
                    router.push(
                      `/country-programme/${currentCountry!.iso3}/${form.year}`,
                    )
                  } catch (error) {
                    if (error.status === 400) {
                      const errors = await error.json()
                      setErrors({ ...errors })
                      enqueueSnackbar(
                        errors.general_error ||
                          'Please make sure all the inputs are correct.',
                        { variant: 'error' },
                      )
                    } else {
                      setErrors({})
                    }
                  }
                }}
              >
                Submit
              </Button>
            </div>
          </Box>
        </Portal>
      </form>
    </>
  )
}

export default function CPCreateWrapper() {
  const { blends, fetchEmptyForm, report, setReport, substances } = useStore(
    (state) => state.cp_reports,
  )

  const dataReady = report.emptyForm.data && blends.data && substances.data

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
    fetchEmptyForm(null, false)
  }, [fetchEmptyForm])

  if (!dataReady) {
    return (
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={!report.error && report.loading}
      />
    )
  }

  return <CPCreate />
}
