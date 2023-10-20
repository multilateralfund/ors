/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable perfectionist/sort-objects */
'use client'

import React, { useCallback, useEffect, useState } from 'react'

import {
  Alert,
  Box,
  Button,
  Collapse,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import cx from 'classnames'
import { AnimatePresence } from 'framer-motion'
import { isEmpty } from 'lodash'
import { useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'

import Field from '@ors/components/manage/Form/Field'
import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Portal from '@ors/components/manage/Utils/Portal'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import Link from '@ors/components/ui/Link/Link'
import api, { getResults } from '@ors/helpers/Api'
import useMakeClassInstance from '@ors/hooks/useMakeClassInstance'
import { Blend, Substance } from '@ors/models/Section'
import SectionA from '@ors/models/SectionA'
import SectionB from '@ors/models/SectionB'
import SectionC from '@ors/models/SectionC'
import SectionD from '@ors/models/SectionD'
import SectionE from '@ors/models/SectionE'
import SectionF from '@ors/models/SectionF'
import useStore from '@ors/store'

import { createSections } from '.'

import { AiFillFilePdf } from '@react-icons/all-files/ai/AiFillFilePdf'
import { IoClose } from '@react-icons/all-files/io5/IoClose'
import { IoDownloadOutline } from '@react-icons/all-files/io5/IoDownloadOutline'
import { IoExpand } from '@react-icons/all-files/io5/IoExpand'

function TabPanel(props: any) {
  const {
    activeSection,
    currentIndex,
    index,
    renderSection,
    section,
    setActiveSection,
    ...rest
  } = props
  const Section: React.FC<any> = section.component

  return (
    <div
      id={section.panelId}
      key={section.panelId}
      aria-labelledby={section.id}
      hidden={activeSection !== index}
      role="tabpanel"
    >
      <AnimatePresence>
        <FadeInOut
          animate={{
            opacity: activeSection === currentIndex ? 1 : 0,
          }}
          transition={{ duration: 0.5 }}
        >
          {((currentIndex === index && renderSection) ||
            (activeSection !== currentIndex && activeSection === index)) && (
            <Section
              index={index}
              section={section}
              setActiveSection={setActiveSection}
              {...rest}
            />
          )}
        </FadeInOut>
      </AnimatePresence>
    </div>
  )
}

export default function CPReportCreate(props: {
  blends: Array<Blend>
  emptyForm: Record<string, any>
  substances: Array<Substance>
}) {
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const countries = useStore((state) => [
    { id: 0, label: 'Any' },
    ...getResults(state.common.countries.data).results.map((country) => ({
      id: country.id,
      label: country.name,
    })),
  ])
  const { blends, substances } = props

  const Sections = {
    section_a: useMakeClassInstance<SectionA>(SectionA, [
      substances,
      'section_a_create',
    ]),
    section_b: useMakeClassInstance<SectionB>(SectionB, [
      substances,
      blends,
      'section_b_create',
    ]),
    section_c: useMakeClassInstance<SectionC>(SectionC, [
      substances,
      blends,
      'section_c_create',
    ]),
    section_d: useMakeClassInstance<SectionD>(SectionD, [
      substances,
      blends,
      'section_d_create',
    ]),
    section_e: useMakeClassInstance<SectionE>(SectionE, ['section_e_create']),
    section_f: useMakeClassInstance<SectionF>(SectionF, ['section_f_create']),
  }

  const [errors, setErrors] = useState<Record<string, any>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeSection, setActiveSection] = useState(null)
  const [renderSection, setRenderSection] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({
    country: null,
    name: '',
    section_a: Sections.section_a.getData(),
    section_b: Sections.section_b.getData(),
    section_c: Sections.section_c.getData(),
    section_d: Sections.section_d.getData(),
    section_e: Sections.section_e.getData(),
    section_f: Sections.section_f.getData(),
    year: new Date().getFullYear(),
  })

  const getSubmitFormData = useCallback(() => {
    return {
      ...form,
      section_a: Sections.section_a.getSubmitFormData(form.section_a),
      section_b: Sections.section_b.getSubmitFormData(form.section_b),
      section_c: Sections.section_c.getSubmitFormData(form.section_c),
      section_d: Sections.section_d.getSubmitFormData(form.section_d),
      section_e: Sections.section_e.getSubmitFormData(form.section_e),
      section_f: Sections.section_f.getSubmitFormData(form.section_f),
      country_id: form.country?.id,
      name: form.country?.label ? `${form.country?.label} ${form.year}` : '',
    }
    /* eslint-disable-next-line */
  }, [form])

  useEffect(() => {
    setTimeout(() => {
      setRenderSection(true)
    }, 600)
  }, [currentIndex])

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

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={currentIndex !== activeSection || !renderSection}
      />
      <HeaderTitle>
        <Typography className="text-white" component="h1" variant="h3">
          New submission
        </Typography>
      </HeaderTitle>
      <form className="create-submission-form">
        <Tabs
          className="scrollable mb-4"
          aria-label="create submission sections"
          scrollButtons="auto"
          value={currentIndex}
          variant="scrollable"
          onChange={(event: React.SyntheticEvent, index: number) => {
            setCurrentIndex(index)
            setRenderSection(false)
          }}
          allowScrollButtonsMobile
        >
          {createSections.map((section) => (
            <Tab
              key={section.id}
              className={cx({ 'MuiTab-error': !isEmpty(errors?.[section.id]) })}
              aria-controls={section.panelId}
              label={section.label}
            />
          ))}
        </Tabs>
        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2 lg:grid-cols-3">
          <Field
            id="country"
            name="country_id"
            options={countries}
            value={form.country?.id}
            widget="autocomplete"
            Input={{
              error: !!errors.country_id,
              helperText: errors.country_id?.general_error,
              label: 'Country',
            }}
            onChange={(_: any, country: any) => {
              setForm({ ...form, country })
            }}
          />
        </div>
        {createSections.map((section, index) => (
          <TabPanel
            key={section.panelId}
            Section={Sections[section.id]}
            activeSection={activeSection}
            currentIndex={currentIndex}
            errors={errors}
            form={form}
            index={index}
            renderSection={renderSection}
            section={section}
            setActiveSection={setActiveSection}
            setForm={setForm}
            TableProps={{
              Toolbar: ({
                enterFullScreen,
                exitFullScreen,
                onPrint,
                print,
                fullScreen,
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
                      {!fullScreen && (
                        <Dropdown
                          color="primary"
                          label={<IoDownloadOutline />}
                          icon
                        >
                          <Dropdown.Item onClick={onPrint}>
                            <div className="flex items-center gap-x-2">
                              <AiFillFilePdf
                                className="fill-red-700"
                                size={24}
                              />
                              <span>PDF</span>
                            </div>
                          </Dropdown.Item>
                        </Dropdown>
                      )}
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
              enableCellChangeFlash: true,
              enableFullScreen: true,
              enablePagination: false,
              fadeInOut: false,
              getRowId: (props: any) => {
                return props.data.rowId
              },
              noRowsOverlayComponentParams: { label: 'No data reported' },
              suppressCellFocus: false,
              suppressRowHoverHighlight: false,
              withSeparators: true,
              errors: errors[section.id],
            }}
            {...props}
          />
        ))}

        <Portal domNode="bottom-control">
          <Box className="rounded-none border-0 border-t px-4">
            <div className="container flex w-full justify-between">
              <Link
                color="secondary"
                href="/country-programme"
                size="small"
                variant="contained"
                button
              >
                Close
              </Link>
              <Button
                color="primary"
                size="small"
                variant="contained"
                onClick={async () => {
                  try {
                    const response = await api(
                      'api/country-programme/reports/',
                      {
                        data: getSubmitFormData(),
                        method: 'POST',
                      },
                    )
                    setErrors({})
                    Sections.section_a.clearLocalStorage()
                    Sections.section_b.clearLocalStorage()
                    Sections.section_c.clearLocalStorage()
                    Sections.section_d.clearLocalStorage()
                    Sections.section_e.clearLocalStorage()
                    Sections.section_f.clearLocalStorage()
                    enqueueSnackbar(
                      <>
                        Added new submission for {form.country.label}{' '}
                        {form.year}.
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
