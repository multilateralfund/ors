'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Box, Button, IconButton, Tab, Tabs, Typography } from '@mui/material'
import cx from 'classnames'
import { produce } from 'immer'
import {
  capitalize,
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
import { useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'

import Portal from '@ors/components/manage/Utils/Portal'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import Error from '@ors/components/theme/Views/Error'
import Link from '@ors/components/ui/Link/Link'
import { FootnotesProvider } from '@ors/contexts/Footnote/Footnote'
import api from '@ors/helpers/Api/Api'
import { defaultSliceData } from '@ors/helpers/Store/Store'
import { parseNumber } from '@ors/helpers/Utils/Utils'
import useMakeClassInstance from '@ors/hooks/useMakeClassInstance'
import SectionA from '@ors/models/SectionA'
import SectionB from '@ors/models/SectionB'
import SectionC from '@ors/models/SectionC'
import SectionD from '@ors/models/SectionD'
import SectionE from '@ors/models/SectionE'
import SectionF from '@ors/models/SectionF'
import { useStore } from '@ors/store'

import { getSections, variants } from '.'

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
  // domLayout: 'autoHeight',
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
  withSeparators: true,
}

function CPEdit(props: { id: null | number }) {
  const tabsEl = React.useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const { blends, report, substances } = useStore((state) => state.cp_reports)

  const Sections = {
    section_a: useMakeClassInstance<SectionA>(SectionA, [
      report.data?.section_a,
      substances.data,
      null,
    ]),
    section_b: useMakeClassInstance<SectionB>(SectionB, [
      report.data?.section_b,
      substances.data,
      blends.data,
      null,
    ]),
    section_c: useMakeClassInstance<SectionC>(SectionC, [
      report.data?.section_c,
      substances.data,
      blends.data,
      null,
    ]),
    section_d: useMakeClassInstance<SectionD>(SectionD, [
      defaults(report.data?.section_d, {
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
  const [activeTab, setActiveTab] = useState(0)
  const [renderedSections, setRenderedSections] = useState<Array<number>>([])

  const variant = useMemo(() => {
    if (!report.data) return null
    return filter(variants, (variant) => {
      const year = report.data?.year
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

    if (!indicator || activeTab === 0) {
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
      {!!report.data && (
        <HeaderTitle memo={report.data.status}>
          <div className="mb-4 flex min-h-[40px] items-center justify-between gap-x-4">
            <Typography className="text-white" component="h1" variant="h3">
              Edit {report.data.name}{' '}
              <span
                className={cx({
                  'rounded bg-success px-2 py-1':
                    report.data.status === 'final',
                  'rounded bg-warning px-2 py-1':
                    report.data.status === 'draft',
                })}
              >
                {capitalize(report.data.status)}
              </span>
            </Typography>
          </div>
        </HeaderTitle>
      )}
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
              className={cx({
                'MuiTab-error': !isEmpty(errors?.[section.id]),
              })}
              aria-controls={section.panelId}
              label={section.label}
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
                  <Section
                    {...props}
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
                      errors: errors[section.id],
                      report,
                      section,
                    }}
                  />
                </FootnotesProvider>
              </div>
            )
          })}

        {!!report.data && (
          <Portal domNode="bottom-control">
            <Box className="rounded-none border-0 border-t px-4">
              <div className="container flex w-full justify-end gap-x-4">
                <Link
                  color="secondary"
                  href={`/country-programme/${report.data?.id || ''}`}
                  size="small"
                  variant="contained"
                  button
                >
                  Close
                </Link>
                {report.data.status === 'draft' && (
                  <Button
                    color="primary"
                    size="small"
                    variant="contained"
                    onClick={async () => {
                      try {
                        const response = await api(
                          `api/country-programme/reports/${report.data?.id}/`,
                          {
                            data: {
                              ...report.data,
                              ...getSubmitFormData(),
                            },
                            method: 'PUT',
                          },
                        )
                        setErrors({})
                        enqueueSnackbar(
                          <>
                            Updated submission for {response.country}{' '}
                            {response.year}.
                          </>,
                          { variant: 'success' },
                        )
                        router.push(`/country-programme/${response.id}`)
                      } catch (error) {
                        if (error.status === 400) {
                          setErrors({ ...(await error.json()) })
                          enqueueSnackbar(
                            <>Please make sure all the inputs are correct.</>,
                            { variant: 'error' },
                          )
                        } else {
                          const errors = await error.json()
                          setErrors({})
                          {
                            errors.detail &&
                              enqueueSnackbar(errors.detail, {
                                variant: 'error',
                              })
                          }
                        }
                      }
                    }}
                  >
                    Update draft
                  </Button>
                )}
                <Button
                  color="primary"
                  size="small"
                  variant="contained"
                  onClick={async () => {
                    try {
                      const response = await api(
                        `api/country-programme/reports/${report.data?.id}/`,
                        {
                          data: {
                            ...report.data,
                            ...getSubmitFormData(),
                            status: 'final',
                          },
                          method: 'PUT',
                        },
                      )
                      setErrors({})
                      enqueueSnackbar(
                        <>
                          Updated submission for {response.country}{' '}
                          {response.year}.
                        </>,
                        { variant: 'success' },
                      )
                      router.push(`/country-programme/${response.id}`)
                    } catch (error) {
                      if (error.status === 400) {
                        setErrors({ ...(await error.json()) })
                        enqueueSnackbar(
                          <>Please make sure all the inputs are correct.</>,
                          { variant: 'error' },
                        )
                      } else {
                        const errors = await error.json()
                        setErrors({})
                        {
                          errors.detail &&
                            enqueueSnackbar(errors.detail, {
                              variant: 'error',
                            })
                        }
                      }
                    }
                  }}
                >
                  {report.data.status === 'draft'
                    ? 'Submit final version'
                    : 'Submit new version'}
                </Button>
              </div>
            </Box>
          </Portal>
        )}
      </form>
    </>
  )
}

export default function CPEditWrapper(props: { id: string }) {
  const { blends, fetchBundle, report, setReport, substances } = useStore(
    (state) => state.cp_reports,
  )

  const id = useMemo(() => parseNumber(props.id), [props.id])

  const dataReady =
    report.data &&
    report.emptyForm.data &&
    blends.data &&
    substances.data &&
    report.data.id === id

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
    fetchBundle(id, false)
  }, [id, fetchBundle])

  if (!dataReady) {
    return (
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={!report.error && report.loading}
      />
    )
  }

  return <CPEdit id={id} />
}
