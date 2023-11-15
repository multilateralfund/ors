/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable perfectionist/sort-objects */
'use client'

import React, { useCallback, useEffect, useState } from 'react'

import { Box, Button, IconButton, Tab, Tabs, Typography } from '@mui/material'
import cx from 'classnames'
import { AnimatePresence } from 'framer-motion'
import { isEmpty } from 'lodash'
import { useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Portal from '@ors/components/manage/Utils/Portal'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import Link from '@ors/components/ui/Link/Link'
import api from '@ors/helpers/Api'
import useMakeClassInstance from '@ors/hooks/useMakeClassInstance'
import { Blend, Substance } from '@ors/models/Section'
import SectionA from '@ors/models/SectionA'
import SectionB from '@ors/models/SectionB'
import SectionC from '@ors/models/SectionC'
import SectionD from '@ors/models/SectionD'
import SectionE from '@ors/models/SectionE'
import SectionF from '@ors/models/SectionF'

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
  report: Record<string, any>
  substances: Array<Substance>
  versions?: any
}) {
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const { blends, substances } = props

  const Sections = {
    section_a: useMakeClassInstance<SectionA>(SectionA, [
      props.report?.section_a,
      substances,
      null,
    ]),
    section_b: useMakeClassInstance<SectionB>(SectionB, [
      props.report?.section_b,
      substances,
      blends,
      null,
    ]),
    section_c: useMakeClassInstance<SectionC>(SectionC, [
      props.report?.section_c,
      substances,
      blends,
      null,
    ]),
    section_d: useMakeClassInstance<SectionD>(SectionD, [
      props.report?.section_d,
      substances,
      blends,
      null,
    ]),
    section_e: useMakeClassInstance<SectionE>(SectionE, [
      props.report?.section_e,
      null,
    ]),
    section_f: useMakeClassInstance<SectionF>(SectionF, [
      props.report?.section_f,
      null,
    ]),
  }

  const [errors, setErrors] = useState<Record<string, any>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeSection, setActiveSection] = useState(null)
  const [renderSection, setRenderSection] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({
    section_a: Sections.section_a.getData(),
    section_b: Sections.section_b.getData(),
    section_c: Sections.section_c.getData(),
    section_d: Sections.section_d.getData(),
    section_e: Sections.section_e.getData(),
    section_f: Sections.section_f.getData(),
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
    }
    /* eslint-disable-next-line */
  }, [form])

  useEffect(() => {
    setTimeout(() => {
      setRenderSection(true)
    }, 600)
  }, [currentIndex])

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={currentIndex !== activeSection || !renderSection}
      />
      <HeaderTitle>
        <div className="mb-4 flex min-h-[40px] items-center justify-between gap-x-4">
          <Typography className="text-white" component="h1" variant="h3">
            Edit <em>{props.report.cp_report.name}</em>
          </Typography>
        </div>
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
                href={`/country-programme/${props.report.cp_report.id || ''}`}
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
                      `api/country-programme/reports/${props.report.cp_report.id}/`,
                      {
                        data: {
                          ...getSubmitFormData(),
                          ...props.report.cp_report,
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
                          enqueueSnackbar(errors.detail, { variant: 'error' })
                      }
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
