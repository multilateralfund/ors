'use client'

import { Country } from '@ors/types/store'
import { UserType, isCountryUserType } from '@ors/types/user_types'

import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { Alert, Button, Tabs, Tooltip, Typography } from '@mui/material'
import cx from 'classnames'
import { produce } from 'immer'
import { filter, get, includes } from 'lodash'
import { useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'

import { defaultColDefEdit } from '@ors/config/Table/columnsDef'

import SectionReportedSelect from '@ors/components/manage/Blocks/Section/SectionReportedSelect'
import Loading from '@ors/components/theme/Loading/Loading'
import Link from '@ors/components/ui/Link/Link'
import SectionOverlay from '@ors/components/ui/SectionOverlay/SectionOverlay'
import SectionTab from '@ors/components/ui/SectionTab/SectionTab'
import { FootnotesProvider } from '@ors/contexts/Footnote/Footnote'
import ValidationProvider from '@ors/contexts/Validation/ValidationProvider'
import { uploadFiles } from '@ors/helpers'
import api from '@ors/helpers/Api/_api'
import { getResults } from '@ors/helpers/Api/Api'
import { defaultSliceData } from '@ors/helpers/Store/Store'
import useApi from '@ors/hooks/useApi'
import useMakeClassInstance from '@ors/hooks/useMakeClassInstance'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'
import SectionA from '@ors/models/SectionA'
import SectionB from '@ors/models/SectionB'
import SectionC from '@ors/models/SectionC'
import SectionD from '@ors/models/SectionD'
import SectionE from '@ors/models/SectionE'
import SectionF from '@ors/models/SectionF'
import { variants } from '@ors/slices/createCPReportsSlice'
import { useStore } from '@ors/store'

import { getSections } from '.'
import Portal from '../../Utils/Portal'
import { CPCreateHeader } from './CPHeader'
import CPRestoreCreate from './CPRestoreCreate'
import CPSectionWrapper from './CPSectionWrapper'
import ConfirmSubmission from './ConfirmSubmission'
import SubmissionExistsDialog from './SubmissionExistsDialog'
import {
  CPBaseForm,
  CPCreateTableProps,
  FormErrors,
  WidgetCountry,
  WidgetYear,
} from './typesCPCreate'
import { useCreateLocalStorage } from './useLocalStorage'

import { IoClose, IoExpand, IoLink } from 'react-icons/io5'

const TableProps: CPCreateTableProps = {
  Toolbar: ({
    enterFullScreen,
    exitFullScreen,
    fullScreen,
    isActiveSection,
    section,
  }) => {
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
          'mb-4 flex md:flex-row md:items-center md:justify-between',
          {
            'flex-col': !fullScreen,
            'flex-col-reverse': fullScreen,
            'px-4': fullScreen,
          },
        )}
      >
        <div className="flex flex-col gap-2">
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
  getRowId: (props) => {
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

const CPCreate: React.FC = () => {
  const tabsEl = React.useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const { report } = useStore((state) => state.cp_reports)
  const user = useStore((state) => state.user)
  const all_countries = useStore(
    (state) => state.common.countries_for_listing.data,
  )
  const [currentCountry, setCurrentCountry] = useState<Country | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [usedRestore, setUsedRestore] = useState(false)

  const [warnOnClose, setWarnOnClose] = useState(false)
  useVisibilityChange(warnOnClose)

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
  const [form, setForm] = useState<CPBaseForm>(() => {
    // Default year is last year
    const lastYear = new Date().getFullYear() - 1
    const lastYearVariant = filter(variants, (variant) => {
      return variant.minYear <= lastYear && variant.maxYear >= lastYear
    })[0]

    return {
      country: null,
      files: [],
      report_info: {
        reported_section_a: true,
        reported_section_b: true,
        reported_section_c: true,
        reported_section_d: true,
        reported_section_e: true,
        reported_section_f: true,
        reporting_email: user.data.email,
        reporting_entry: user.data.full_name,
      },
      section_a: includes(['V'], lastYearVariant?.model)
        ? []
        : Sections.section_a.getData(),
      section_b: includes(['V'], lastYearVariant?.model)
        ? []
        : Sections.section_b.getData(),
      section_c: includes(['V'], lastYearVariant?.model)
        ? []
        : Sections.section_c.getData(),
      section_d: Sections.section_d.getData(),
      section_e: Sections.section_e.getData(),
      section_f: Sections.section_f.getData(),
      year: lastYear,
    }
  })

  const localStorage = useCreateLocalStorage()

  useEffect(
    function () {
      if (form?.country?.id) {
        setCurrentCountry(
          all_countries.filter((c) => c.id === form!.country!.id)[0],
        )
      }
    },
    [form, all_countries],
  )

  const handleSetForm = useCallback(
    (value: ((form: CPBaseForm) => CPBaseForm) | CPBaseForm) => {
      setForm((prevForm) => {
        const nextForm = typeof value === 'function' ? value(prevForm) : value
        localStorage.update(nextForm)
        return nextForm
      })
      setWarnOnClose(true)
    },
    [localStorage],
  )

  const variant = useMemo(() => {
    return filter(variants, (variant) => {
      return variant.minYear <= form.year && variant.maxYear >= form.year
    })[0]
  }, [form.year])
  const [activeTab, setActiveTab] = useState(0)
  const { setActiveTab: setActiveTabStore } = useStore(
    (state) => state.cp_current_tab,
  )
  const [renderedSections, setRenderedSections] = useState<number[]>([])

  const existingReports = useApi({
    options: {
      triggerIf: !!form.country?.id,
    },
    path: `/api/country-programme/reports/?year_max=${form.year}&year_min=${form.year}&country_id=${form.country?.id}`,
  })

  const sections = useMemo(
    () => (variant ? getSections(variant, 'edit') : []),
    [variant],
  )

  const countryFieldProps = {
    id: 'country',
    Input: {
      error: !!errors.country_id,
      helperText: errors.country_id?.general_error,
      // label: 'Country',
    },
    disabled: existingReports.loading,
    name: 'country_id',
    onChange: (_: ChangeEvent, value: WidgetCountry) => {
      handleSetForm({ ...form, country: value })
    },
    options: countries,
    value: form.country,
    widget: 'autocomplete',
  }

  const yearOptions = useMemo(() => {
    const lastYear = new Date().getFullYear() - 1
    return Array.from(
      { length: lastYear - 2023 + 1 },
      (_, i) => lastYear - i,
    ).map((year) => ({
      id: year,
      label: `${year}`,
    }))
  }, [])
  const yearFieldProps = {
    id: 'year',
    Input: {
      error: !!errors.year,
      helperText: errors.year?.general_error,
    },
    disabled: existingReports.loading,
    name: 'year',
    onChange: (_event: any, value: WidgetYear) => {
      handleSetForm((oldForm: any) => ({ ...oldForm, year: value.id }))
    },
    options: yearOptions,
    value: { id: form.year, label: `${form.year}` },
    widget: 'autocomplete',
  }

  const getSubmitFormData = useCallback(() => {
    return {
      ...form,
      country_id: form.country?.id,
      files: form.files,
      name: form.country?.label ? `${form.country?.label} ${form.year}` : '',
      report_info: {
        reported_section_a: form.report_info.reported_section_a,
        reported_section_b: form.report_info.reported_section_b,
        reported_section_c: form.report_info.reported_section_c,
        reported_section_d: form.report_info.reported_section_d,
        reported_section_e: form.report_info.reported_section_e,
        reported_section_f: form.report_info.reported_section_f,
        reporting_email: form.report_info.reporting_email,
        reporting_entry: form.report_info.reporting_entry,
      },
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
      path: `/api/country-programme/reports/?year_max=${form.year}&year_min=${form.year}&country_id=${form.country?.id}`,
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
  }, [renderedSections.length, activeTab])

  useEffect(() => {
    const user_type = user.data.user_type

    if (isCountryUserType[user_type as UserType]) {
      const country_id = user.data.country_id
      const user_country = user.data.country

      setForm({
        ...form,
        country: { id: country_id!, label: user_country! },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [sectionsChecked, setSectionsChecked] = useState({
    reported_section_a: form.report_info.reported_section_a ?? true,
    reported_section_b: form.report_info.reported_section_b ?? true,
    reported_section_c: form.report_info.reported_section_c ?? true,
    reported_section_d: form.report_info.reported_section_d ?? true,
    reported_section_e: form.report_info.reported_section_e ?? true,
    reported_section_f: form.report_info.reported_section_f ?? true,
  })
  const onSectionCheckChange = (section: string, isChecked: boolean) => {
    setSectionsChecked((prevState: any) => ({
      ...prevState,
      [section]: isChecked,
    }))

    handleSetForm((prevState: any) => ({
      ...prevState,
      report_info: {
        ...prevState.report_info,
        [section]: isChecked,
      },
    }))
  }

  function getFormSubmitter(reportStatus: 'draft' | 'final') {
    return async () => {
      try {
        const allData = getSubmitFormData()

        const { files, ...reportData } = allData

        if (files && files.length > 0) {
          await uploadFiles(
            `api/country-programme/files/?country_id=${currentCountry?.id}&year=${form.year}`,
            files,
          )
        }

        await api('api/country-programme/reports/', {
          data: {
            ...reportData,
            status: reportStatus,
          },
          method: 'POST',
        })
        setErrors({})
        Sections.section_a.clearLocalStorage()
        Sections.section_b.clearLocalStorage()
        Sections.section_c.clearLocalStorage()
        Sections.section_d.clearLocalStorage()
        Sections.section_e.clearLocalStorage()
        Sections.section_f.clearLocalStorage()
        localStorage.clear()
        setWarnOnClose(false)
        enqueueSnackbar(
          <>
            Added new submission for {form.country!.label} {form.year}.
          </>,
          { variant: 'success' },
        )
        router.push(
          `/country-programme/${currentCountry!.iso3}/${form.year}/edit`,
        )
      } catch (error) {
        if (error.status === 400) {
          const errors = await error.json()
          setErrors({ ...errors })
          enqueueSnackbar(
            errors.general_error ||
              errors.files ||
              'Please make sure all the inputs are correct.',
            { variant: 'error' },
          )
        } else {
          enqueueSnackbar(<>An error occurred. Please try again.</>, {
            variant: 'error',
          })
          setErrors({})
        }
      }
    }
  }

  function handleShowConfirmation() {
    setShowConfirm(true)
  }

  function handleSubmissionConfirmation() {
    setShowConfirm(false)
    getFormSubmitter('final')()
  }

  function handleRestoreData(storedData: any) {
    setUsedRestore(true)
    handleSetForm(storedData)
  }

  return (
    <ValidationProvider form={form} model={variant.model}>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={
          !report.error &&
          (report.loading || !includes(renderedSections, activeTab))
        }
      />
      <CPCreateHeader
        currentYear={form.year}
        actions={
          <div className="flex items-center">
            <div className="container flex w-full justify-between gap-x-4 px-0">
              <Link
                className="btn-close bg-gray-600 px-4 py-2 shadow-none"
                color="secondary"
                href="/country-programme"
                size="large"
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
                className="px-4 py-2 shadow-none"
                color="secondary"
                size="large"
                variant="contained"
                disabled={
                  !!existingReports.data?.length || existingReports.loading
                }
                onClick={getFormSubmitter('draft')}
              >
                Save draft
              </Button>
              <Button
                className="px-4 py-2 shadow-none"
                color="secondary"
                size="large"
                variant="contained"
                disabled={
                  !!existingReports.data?.length || existingReports.loading
                }
                onClick={handleShowConfirmation}
              >
                Submit
              </Button>
            </div>
          </div>
        }
      />
      <CPRestoreCreate
        localStorage={localStorage}
        onRestore={handleRestoreData}
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
              setActiveTabStore(index)
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
          {!!existingReports.data?.length && currentCountry && (
            <SubmissionExistsDialog
              existingReportTitle={existingReports.data[0].name}
              href={`/country-programme/${currentCountry.iso3}/${form.year}`}
              onCancel={function () {
                setForm(function (prev) {
                  return { ...prev, country: null }
                })
                localStorage.clear()
              }}
            />
          )}

          {!!Object.keys(errors).length && (
            <Alert className="mb-12" severity="error">
              <Typography>
                Please make sure a country is selected and all the sections are
                valid.
              </Typography>
            </Alert>
          )}
          {sections.map((section, index) => {
            if (!includes(renderedSections, index)) return null
            const sectionName: string = `reported_${section.id}`
            const isSectionChecked: boolean =
              section.id === 'report_info' ||
              // @ts-ignore
              sectionsChecked[sectionName] ||
              false
            const showSectionSelect =
              variant?.model === 'V' && section.id !== 'report_info'
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
                      Section={get(Sections, section.id)}
                      Sections={Sections}
                      countryFieldProps={countryFieldProps}
                      emptyForm={report.emptyForm.data || {}}
                      errors={errors}
                      form={form}
                      isCreate={true}
                      report={report.data}
                      section={section}
                      sectionsChecked={sectionsChecked}
                      setForm={handleSetForm}
                      variant={variant}
                      yearFieldProps={yearFieldProps}
                      TableProps={{
                        ...TableProps,
                        context: { section, variant, year: form.year },
                        errors: errors[section.id],
                        isActiveSection: activeTab == index,
                        report,
                        section,
                      }}
                      showCloneDialog={
                        !existingReports.data?.length &&
                        !!currentCountry &&
                        !usedRestore
                      }
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
      {showConfirm ? (
        <ConfirmSubmission
          mode={'create'}
          onCancel={() => setShowConfirm(false)}
          onSubmit={handleSubmissionConfirmation}
        />
      ) : null}
    </ValidationProvider>
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
